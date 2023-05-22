import isEqual from 'lodash/isEqual';
import memoize from 'lodash/memoize';
import omit from 'lodash/omit';
import {
  Suspense,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  MODULE_KINDS,
  MODULE_KIND_SIMPLE_TEXT,
} from '@azzapp/shared/cardModuleHelpers';
import { useRouter } from '#PlatformEnvironment';
import CoverRenderer from '#components/CoverRenderer';
import { createId } from '#helpers/idHelpers';
import useViewportSize, { VW100 } from '#hooks/useViewportSize';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import SimpleTextRenderer from '../../components/SimpleTextRenderer';
import ModuleSelectionListModal from './ModuleSelectionListModal';
import ProfileBlockContainer from './ProfileBlockContainer';
import ProfileScreenFooter from './ProfileScreenFooter';
import ProfileScreenHeader from './ProfileScreenHeader';
import ProfileScreenScrollView from './ProfileScreenScrollView';
import type { NativeRouter } from '#components/NativeRouter';
import type { ProfileScreen_profile$key } from '@azzapp/relay/artifacts/ProfileScreen_profile.graphql';
import type { ProfileScreenBody_card$key } from '@azzapp/relay/artifacts/ProfileScreenBody_card.graphql';
import type { ProfileScreenDeleteModuleMutation } from '@azzapp/relay/artifacts/ProfileScreenDeleteModuleMutation.graphql';
import type { ProfileScreenDuplicateModuleMutation } from '@azzapp/relay/artifacts/ProfileScreenDuplicateModuleMutation.graphql';
import type { ProfileScreenSwapModulesMutation } from '@azzapp/relay/artifacts/ProfileScreenSwapModulesMutation.graphql';
import type { ProfileScreenToggleFollowMutation } from '@azzapp/relay/artifacts/ProfileScreenToggleFollowMutation.graphql';
import type { ProfileScreenUpdateModulesVisibilityMutation } from '@azzapp/relay/artifacts/ProfileScreenUpdateModulesVisibilityMutation.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { ForwardedRef } from 'react';
import type {
  SelectorStoreUpdater,
  RecordSourceSelectorProxy,
} from 'relay-runtime';

type ProfileScreenProps = {
  profile: ProfileScreen_profile$key;
  ready?: boolean;
};

const ProfileScreen = ({
  profile: profileKey,
  ready = true,
}: ProfileScreenProps) => {
  // #region Data
  const profile = useFragment(
    graphql`
      fragment ProfileScreen_profile on Profile {
        id
        userName
        card {
          id
          cover {
            ...CoverRenderer_cover
          }
          ...ProfileScreenBody_card
        }
      }
    `,
    profileKey,
  );
  // #endregion

  // #region Navigation
  const router = useRouter();
  const onHome = () => {
    if (Platform.OS === 'web') {
      router.push({ route: 'HOME' });
    } else {
      (router as NativeRouter).backToTop();
    }
  };

  const onClose = useCallback(() => {
    router.back();
  }, [router]);
  // #endregion

  // #region Edition state
  const [editing, setEditing] = useState(false);
  const [editingDisplayMode, setEditingDisplayMode] = useState<
    'desktop' | 'mobile' | 'preview'
  >('mobile');

  const onEdit = useCallback(() => {
    setEditing(true);
  }, []);

  const onDone = useCallback(() => {
    setEditing(false);
    setEditingDisplayMode('mobile');
  }, []);

  // #endregion

  // #region Color picker
  const [showColorPicker, setShowColorPicker] = useState(false);
  const onRequestColorPicker = useCallback(() => {
    setShowColorPicker(true);
  }, []);

  const onCloseColorPicker = useCallback(() => {
    setShowColorPicker(false);
  }, []);
  // #endregion

  // #region New Module
  const [showModulePicker, setShowModulePicker] = useState(false);
  const onRequestNewModule = useCallback(() => {
    setShowModulePicker(true);
  }, []);

  const onCloseModulePicker = useCallback(() => {
    setShowModulePicker(false);
  }, []);

  const onSelectModuleKind = useCallback(
    (module: ModuleKind) => {
      setShowModulePicker(false);
      router.push({
        route: 'CARD_MODULE_EDITION',
        params: { module, isNew: true },
      });
    },
    [router],
  );
  // #endregion

  // #region Module edition
  const onEditModule = useCallback(
    (module: ModuleKind, moduleId: string) => {
      if (!MODULE_KINDS.includes(module)) {
        // unhanded module kind could be a future addition
        return;
      }
      router.push({
        route: 'CARD_MODULE_EDITION',
        params: {
          module,
          moduleId,
        },
      });
    },
    [router],
  );

  const onEditCover = useCallback(() => {
    router.push({
      route: 'CARD_MODULE_EDITION',
      params: {
        module: 'cover',
      },
    });
  }, [router]);

  const [selectionMode, setSelectionMode] = useState(false);
  const [
    {
      nbSelectedModules,
      selectionContainsHiddenModules,
      selectionContainsAllModules,
    },
    setSelectionInfos,
  ] = useState<ModuleSelectionInfos>({
    nbSelectedModules: 0,
    selectionContainsHiddenModules: false,
    selectionContainsAllModules: false,
  });

  const onEnableSelectionMode = useCallback(() => {
    setSelectionMode(true);
  }, []);

  const onCancelSelectionMode = useCallback(() => {
    setSelectionMode(false);
  }, []);

  const onSelectionStateChange = useCallback((info: ModuleSelectionInfos) => {
    setSelectionInfos(info);
  }, []);

  const profileBodyRef = useRef<ProfileBodyHandle>(null);

  const onSelectAllModules = useCallback(() => {
    profileBodyRef.current?.selectAllModules();
  }, []);

  const onUnSelectAllModules = useCallback(() => {
    profileBodyRef.current?.unselectAllModules();
  }, []);

  const onDeleteSelectedModules = useCallback(() => {
    profileBodyRef.current?.deleteSelectedModules();
    setSelectionMode(false);
  }, []);

  const onToggleSelectedModulesVisibility = useCallback((visible: boolean) => {
    profileBodyRef.current?.toggleSelectedModulesVisibility(visible);
    setSelectionMode(false);
  }, []);
  // #endregion

  // #region Follow
  const [commitToggleFollow, toggleFollowingActive] =
    useMutation<ProfileScreenToggleFollowMutation>(graphql`
      mutation ProfileScreenToggleFollowMutation(
        $input: ToggleFollowingInput!
      ) {
        toggleFollowing(input: $input) {
          profile {
            id
            isFollowing
          }
        }
      }
    `);

  const onToggleFollow = (follow: boolean) => {
    // TODO do we really want to prevent fast clicking?
    if (toggleFollowingActive) {
      return;
    }
    commitToggleFollow({
      variables: {
        input: {
          profileId: profile.id,
          follow,
        },
      },
      optimisticResponse: {
        toggleFollowing: {
          profile: {
            id: profile.id,
            isFollowing: follow,
          },
        },
      },
      onError(error) {
        // TODO: handle error
        console.log(error);
      },
    });
  };
  // #endregion

  const vp = useViewportSize();
  return (
    <>
      <Container style={{ flex: 1 }}>
        <ProfileScreenHeader
          editing={editing}
          ready={ready}
          nbSelectedModules={nbSelectedModules}
          selectionMode={selectionMode}
          selectionContainsAllModules={selectionContainsAllModules}
          onDone={onDone}
          onClose={onClose}
          onEditModules={onEnableSelectionMode}
          onCancelEditModules={onCancelSelectionMode}
          onSelectAllModules={onSelectAllModules}
          onUnSelectAllModules={onUnSelectAllModules}
        />
        <ProfileScreenScrollView editing={editing} ready={ready}>
          <ProfileBlockContainer
            editing={editing}
            displayEditionButtons={false}
            onModulePress={onEditCover}
          >
            <CoverRenderer
              cover={profile.card?.cover}
              userName={profile.userName}
              width={vp`${VW100}`}
              videoEnabled={ready}
              hideBorderRadius
            />
          </ProfileBlockContainer>
          <Suspense fallback={null}>
            {profile.card && (
              <ProfileScreenBody
                ref={profileBodyRef}
                card={profile.card}
                editing={editing}
                selectionMode={selectionMode}
                onEditModule={onEditModule}
                onSelectionStateChange={onSelectionStateChange}
              />
            )}
          </Suspense>
        </ProfileScreenScrollView>
        <ProfileScreenFooter
          editing={editing}
          ready={ready}
          userName={profile.userName}
          currentEditionView={editingDisplayMode}
          selectionMode={selectionMode}
          hasSelectedModules={nbSelectedModules > 0}
          selectionContainsHiddenModules={selectionContainsHiddenModules}
          onHome={onHome}
          onEdit={onEdit}
          onToggleFollow={onToggleFollow}
          onEditingDisplayModeChange={setEditingDisplayMode}
          onRequestNewModule={onRequestNewModule}
          onRequestColorPicker={onRequestColorPicker}
          onDelete={onDeleteSelectedModules}
          onToggleVisibility={onToggleSelectedModulesVisibility}
        />
      </Container>
      <ModuleSelectionListModal
        visible={showModulePicker}
        onRequestClose={onCloseModulePicker}
        onSelectModuleKind={onSelectModuleKind}
        animationType="slide"
      />
      <BottomSheetModal
        visible={showColorPicker}
        onRequestClose={onCloseColorPicker}
        height={vp`${VW100} / ${2}`}
      />
    </>
  );
};

export default ProfileScreen;

type ModuleSelectionInfos = {
  nbSelectedModules: number;
  selectionContainsAllModules: boolean;
  selectionContainsHiddenModules: boolean;
};

type ProfileScreenBodyProps = {
  card: ProfileScreenBody_card$key;
  editing: boolean;
  selectionMode: boolean;
  onEditModule: (module: ModuleKind, moduleId: string) => void;
  onSelectionStateChange: (info: ModuleSelectionInfos) => void;
};

type ProfileBodyHandle = {
  deleteSelectedModules: () => void;
  toggleSelectedModulesVisibility: (visible: boolean) => void;
  selectAllModules: () => void;
  unselectAllModules: () => void;
};

const _ProfileScreenBody = (
  {
    card,
    editing,
    selectionMode,
    onEditModule,
    onSelectionStateChange,
  }: ProfileScreenBodyProps,
  forwardedRef: ForwardedRef<ProfileBodyHandle>,
): any => {
  // #region Relay
  const { id: cardId, modules } = useFragment(
    graphql`
      fragment ProfileScreenBody_card on Card {
        id
        modules {
          id
          kind
          visible
          ...SimpleTextRenderer_module
        }
      }
    `,
    card,
  );

  const [commitSwapModules, swapModulesActive] =
    useMutation<ProfileScreenSwapModulesMutation>(graphql`
      mutation ProfileScreenSwapModulesMutation($input: SwapModulesInput!) {
        swapModules(input: $input) {
          clientMutationId
        }
      }
    `);

  const [commitDeleteModules, deleteModulesActive] =
    useMutation<ProfileScreenDeleteModuleMutation>(
      graphql`
        mutation ProfileScreenDeleteModuleMutation(
          $input: DeleteModulesInput!
        ) {
          deleteModules(input: $input) {
            clientMutationId
          }
        }
      `,
    );

  const [commitDuplicateModule, duplicateModuleActive] =
    useMutation<ProfileScreenDuplicateModuleMutation>(
      graphql`
        mutation ProfileScreenDuplicateModuleMutation(
          $input: DuplicateModuleInput!
        ) {
          duplicateModule(input: $input) {
            createdModuleId
          }
        }
      `,
    );

  const [commitUpdateModulesVisibility, updateModulesVisibilityActive] =
    useMutation<ProfileScreenUpdateModulesVisibilityMutation>(
      graphql`
        mutation ProfileScreenUpdateModulesVisibilityMutation(
          $input: UpdateModulesVisibilityInput!
        ) {
          updateModulesVisibility(input: $input) {
            clientMutationId
          }
        }
      `,
    );

  const moduleMutationActive =
    swapModulesActive ||
    deleteModulesActive ||
    duplicateModuleActive ||
    updateModulesVisibilityActive;
  // #endregion

  // #region Selection
  const [selectedModules, setSelectedModules] = useState<
    Record<string, boolean>
  >({});

  const onSelectModule = useCallback((moduleId: string, selected: boolean) => {
    setSelectedModules(prev => {
      const next = { ...prev };
      if (selected) {
        next[moduleId] = true;
      } else {
        delete next[moduleId];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!selectionMode) {
      setSelectedModules(selectedModules =>
        Object.keys(selectedModules) ? {} : selectedModules,
      );
    }
  }, [selectionMode]);

  useEffect(() => {
    onSelectionStateChange({
      nbSelectedModules: Object.keys(selectedModules).length,
      selectionContainsAllModules:
        Object.keys(selectedModules).length === modules.length,
      selectionContainsHiddenModules: Object.keys(selectedModules).some(
        moduleId => !modules.find(module => module?.id === moduleId)?.visible,
      ),
    });
  }, [selectedModules, onSelectionStateChange, modules]);
  // #endregion

  // #region Modules manipulation
  const onMoveModule = useCallback(
    (moduleId: string, direction: 'down' | 'up') => {
      if (moduleMutationActive) {
        return;
      }
      const moduleIndex = modules.findIndex(module => module?.id === moduleId);
      if (moduleIndex === -1) {
        return;
      }
      const nextModuleIndex =
        direction === 'down' ? moduleIndex + 1 : moduleIndex - 1;
      if (nextModuleIndex < 0 || nextModuleIndex >= modules.length) {
        return;
      }
      const nextModule = modules[nextModuleIndex];

      const updater: SelectorStoreUpdater<unknown> = store => {
        const cardRecord = store.get(cardId);
        if (!cardRecord) {
          return;
        }
        const modulesRecord = cardRecord.getLinkedRecords('modules');
        if (!modulesRecord) {
          return;
        }
        const newModules = [...modulesRecord];
        const moduleARecord = newModules[moduleIndex];
        const moduleBRecord = newModules[nextModuleIndex];
        newModules[moduleIndex] = moduleBRecord;
        newModules[nextModuleIndex] = moduleARecord;
        cardRecord.setLinkedRecords(newModules, 'modules');
      };

      commitSwapModules({
        variables: {
          input: {
            moduleAId: moduleId,
            moduleBId: nextModule.id,
          },
        },
        updater,
        optimisticUpdater: updater,
      });
    },
    [commitSwapModules, moduleMutationActive, cardId, modules],
  );

  const deleteModules = useCallback(
    (modulesIds: string[]) => {
      if (moduleMutationActive) {
        return;
      }
      const updater: SelectorStoreUpdater<unknown> = store => {
        const cardRecord = store.get(cardId);
        if (!cardRecord) {
          return;
        }
        const modulesRecord = cardRecord.getLinkedRecords('modules');
        if (!modulesRecord) {
          return;
        }
        const newModules = modulesRecord.filter(
          moduleRecord => !modulesIds.includes(moduleRecord?.getDataID()),
        );
        cardRecord.setLinkedRecords(newModules, 'modules');
      };
      commitDeleteModules({
        variables: {
          input: {
            modulesIds,
          },
        },
        updater,
        optimisticUpdater: updater,
      });
    },
    [cardId, commitDeleteModules, moduleMutationActive],
  );

  const onRemoveModule = useCallback(
    (moduleId: string) => {
      deleteModules([moduleId]);
    },
    [deleteModules],
  );

  const onDuplicateModule = useCallback(
    (moduleId: string) => {
      if (moduleMutationActive) {
        return;
      }

      const updater = (
        store: RecordSourceSelectorProxy,
        newModuleId: string,
      ) => {
        const cardRecord = store.get(cardId);
        if (!cardRecord) {
          return;
        }
        let modules = cardRecord.getLinkedRecords('modules') ?? [];
        const moduleRecordIndex = modules.findIndex(
          moduleRecord => moduleRecord?.getDataID() === moduleId,
        );
        if (moduleRecordIndex === -1) {
          return;
        }
        const moduleRecord = modules[moduleRecordIndex];
        const newModuleRecord = store.create(
          newModuleId,
          moduleRecord.getType(),
        );
        newModuleRecord.copyFieldsFrom(moduleRecord);
        newModuleRecord.setValue(newModuleId, 'id');
        modules = [...modules];
        modules.splice(moduleRecordIndex + 1, 0, newModuleRecord);
        cardRecord.setLinkedRecords(modules, 'modules');
      };

      commitDuplicateModule({
        variables: {
          input: {
            moduleId,
          },
        },
        updater(store, response) {
          const createdModuleId = response.duplicateModule?.createdModuleId;
          if (!createdModuleId) {
            //TODO
            return;
          }
          updater(store, createdModuleId);
        },
        optimisticUpdater(store) {
          updater(store, `temp-${createId()}`);
        },
      });
    },
    [cardId, commitDuplicateModule, moduleMutationActive],
  );

  const updateModulesVisibility = useCallback(
    (modulesIds: string[], visible: boolean) => {
      if (moduleMutationActive) {
        return;
      }
      const updater: SelectorStoreUpdater<unknown> = store => {
        modulesIds.forEach(moduleId => {
          const moduleRecord = store.get(moduleId);
          if (!moduleRecord) {
            return;
          }
          moduleRecord.setValue(visible, 'visible');
        });
      };
      commitUpdateModulesVisibility({
        variables: {
          input: {
            modulesIds,
            visible,
          },
        },
        updater,
        optimisticUpdater: updater,
      });
    },
    [commitUpdateModulesVisibility, moduleMutationActive],
  );

  const onToggleModuleVisibility = useCallback(
    (moduleId: string, visible: boolean) => {
      updateModulesVisibility([moduleId], visible);
    },
    [updateModulesVisibility],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      deleteSelectedModules() {
        deleteModules(Object.keys(selectedModules));
        setSelectedModules({});
      },
      toggleSelectedModulesVisibility(visible) {
        updateModulesVisibility(Object.keys(selectedModules), visible);
        setSelectedModules({});
      },
      selectAllModules() {
        setSelectedModules(
          modules.reduce((acc, module) => {
            acc[module.id] = true;
            return acc;
          }, {} as Record<string, boolean>),
        );
      },
      unselectAllModules() {
        setSelectedModules({});
      },
    }),
    [deleteModules, modules, selectedModules, updateModulesVisibility],
  );
  //#endregion

  // see @ProfileBlockContainerMemo
  const getModuleCallbacks = useMemo(
    () =>
      memoize((id: string, kind: ModuleKind) => ({
        onModulePress() {
          onEditModule(kind, id);
        },
        onDuplicate() {
          onDuplicateModule(id);
        },
        onRemove() {
          onRemoveModule(id);
        },
        onMoveUp() {
          onMoveModule(id, 'up');
        },
        onMoveDown() {
          onMoveModule(id, 'down');
        },
        onToggleVisibility(visible: boolean) {
          onToggleModuleVisibility(id, visible);
        },
        onSelect(selected: boolean) {
          onSelectModule(id, selected);
        },
      })),
    [
      onDuplicateModule,
      onEditModule,
      onMoveModule,
      onRemoveModule,
      onSelectModule,
      onToggleModuleVisibility,
    ],
  );

  return modules.map((module, index) => (
    <ProfileBlockContainerMemo
      key={module.id}
      editing={editing}
      isFirst={index === 0}
      isLast={index === modules.length - 1}
      visible={module.visible}
      selectionMode={selectionMode}
      selected={!!selectedModules[module.id]}
      {...getModuleCallbacks(module.id, module.kind as ModuleKind)}
    >
      {module.kind === MODULE_KIND_SIMPLE_TEXT && (
        <SimpleTextRenderer module={module} />
      )}
    </ProfileBlockContainerMemo>
  ));
};

const ProfileScreenBody = memo(forwardRef(_ProfileScreenBody));

// Perhaps a premature optimization, but with all the animations going on, it's better to memoize this component
// so that it doesn't re-render unnecessarily
const ProfileBlockContainerMemo = memo(ProfileBlockContainer, (prev, next) => {
  return isEqual(omit(prev, 'children'), omit(next, 'children'));
});
