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
import { useIntl } from 'react-intl';
import { Platform, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { CARD_DEFAULT_BACKGROUND_COLOR } from '@azzapp/shared/cardHelpers';
import {
  MODULE_KINDS,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_SIMPLE_BUTTON,
} from '@azzapp/shared/cardModuleHelpers';
import { useRouter } from '#PlatformEnvironment';
import CarouselRenderer from '#components/CarouselRenderer';
import CoverRenderer from '#components/CoverRenderer';
import HorizontalPhotoRenderer from '#components/HorizontalPhotoRenderer';
import LineDividerRenderer from '#components/LineDividerRenderer';
import ProfileColorPicker from '#components/ProfileColorPicker';
import SimpleButtonRenderer from '#components/SimpleButtonRenderer';
import { createId } from '#helpers/idHelpers';
import useToggleFollow from '#hooks/useToggleFollow';
import useViewportSize, { VW100 } from '#hooks/useViewportSize';
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
  userProfileId?: string;
};

const ProfileScreen = ({
  profile: profileKey,
  ready = true,
  userProfileId,
}: ProfileScreenProps) => {
  // #region Data
  const profile = useFragment(
    graphql`
      fragment ProfileScreen_profile on Profile {
        id
        userName
        card {
          id
          backgroundColor
          cover {
            ...CoverRenderer_cover
          }
          ...ProfileScreenBody_card
        }
        ...ProfileColorPicker_profile
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
    'desktop' | 'mobile'
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
  const [backgroundColor, setBackgroundColor] = useState(
    profile.card?.backgroundColor ?? CARD_DEFAULT_BACKGROUND_COLOR,
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const onRequestColorPicker = useCallback(() => {
    setShowColorPicker(true);
  }, []);

  const onCloseColorPicker = useCallback(() => {
    setShowColorPicker(false);
  }, []);

  const [commitBackground] = useMutation(graphql`
    mutation ProfileScreenUpdateCardMutation($input: UpdateCardInput!) {
      updateCard(input: $input) {
        card {
          id
          backgroundColor
        }
      }
    }
  `);

  const firstTime = useRef(true);
  const [debouncedBackgroundColor] = useDebounce(backgroundColor, 300);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }
    commitBackground({
      variables: {
        input: {
          backgroundColor: debouncedBackgroundColor,
        },
      },
    });
  }, [commitBackground, debouncedBackgroundColor]);
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

  const onToggleFollow = useToggleFollow(userProfileId);

  // #endregion

  const vp = useViewportSize();
  const intl = useIntl();

  return (
    <>
      <View style={{ flex: 1, backgroundColor }}>
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
            backgroundColor={backgroundColor}
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
                backgroundColor={backgroundColor}
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
          backgroundColor={backgroundColor}
          onHome={onHome}
          onEdit={onEdit}
          onToggleFollow={(follow: boolean) =>
            onToggleFollow(profile.id, follow)
          }
          onEditingDisplayModeChange={setEditingDisplayMode}
          onRequestNewModule={onRequestNewModule}
          onRequestColorPicker={onRequestColorPicker}
          onDelete={onDeleteSelectedModules}
          onToggleVisibility={onToggleSelectedModulesVisibility}
        />
      </View>
      <ModuleSelectionListModal
        visible={showModulePicker}
        onRequestClose={onCloseModulePicker}
        onSelectModuleKind={onSelectModuleKind}
        animationType="slide"
      />
      <Suspense>
        <ProfileColorPicker
          title={intl.formatMessage({
            defaultMessage: 'Web card color',
            description: 'Profile screen color picker title',
          })}
          profile={profile}
          visible={showColorPicker}
          selectedColor={
            profile.card?.backgroundColor ?? CARD_DEFAULT_BACKGROUND_COLOR
          }
          height={350}
          onColorChange={setBackgroundColor}
          onRequestClose={onCloseColorPicker}
        />
      </Suspense>
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
  backgroundColor: string;
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
    backgroundColor,
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
        backgroundColor
        modules {
          id
          kind
          visible
          ...HorizontalPhotoRenderer_module
          ...SimpleButtonRenderer_module
          ...SimpleTextRenderer_module
          ...LineDividerRenderer_module
          ...CarouselRenderer_module
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
      backgroundColor={backgroundColor}
      {...getModuleCallbacks(module.id, module.kind as ModuleKind)}
    >
      {module.kind === MODULE_KIND_SIMPLE_TEXT && (
        <SimpleTextRenderer module={module} />
      )}
      {module.kind === MODULE_KIND_SIMPLE_TITLE && (
        <SimpleTextRenderer module={module} />
      )}
      {module.kind === MODULE_KIND_LINE_DIVIDER && (
        <LineDividerRenderer module={module} />
      )}
      {module.kind === MODULE_KIND_HORIZONTAL_PHOTO && (
        <HorizontalPhotoRenderer module={module} />
      )}
      {module.kind === MODULE_KIND_CAROUSEL && (
        <CarouselRenderer module={module} />
      )}
      {module.kind === MODULE_KIND_SIMPLE_BUTTON && (
        <SimpleButtonRenderer module={module} />
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
