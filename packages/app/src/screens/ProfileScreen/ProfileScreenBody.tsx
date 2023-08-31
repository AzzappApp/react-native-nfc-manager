import isEqual from 'lodash/isEqual';
import memoize from 'lodash/memoize';
import omit from 'lodash/omit';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  graphql,
  useFragment,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { swap } from '@azzapp/shared/arrayHelpers';
import CardModuleRenderer from '#components/cardModules/CardModuleRenderer';
import { useModulesData } from '#components/cardModules/ModuleData';
import { createId } from '#helpers/idHelpers';
import ProfileBlockContainer from './ProfileBlockContainer';
import type { ProfileScreenBody_profile$key } from '@azzapp/relay/artifacts/ProfileScreenBody_profile.graphql';
import type { ProfileScreenBodyDeleteModuleMutation } from '@azzapp/relay/artifacts/ProfileScreenBodyDeleteModuleMutation.graphql';
import type { ProfileScreenBodyDuplicateModuleMutation } from '@azzapp/relay/artifacts/ProfileScreenBodyDuplicateModuleMutation.graphql';
import type { ProfileScreenBodySwapModulesMutation } from '@azzapp/relay/artifacts/ProfileScreenBodySwapModulesMutation.graphql';
import type { ProfileScreenBodyUpdateModulesVisibilityMutation } from '@azzapp/relay/artifacts/ProfileScreenBodyUpdateModulesVisibilityMutation.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { ForwardedRef } from 'react';
import type { Disposable } from 'react-relay';
import type { StoreUpdater, RecordSourceSelectorProxy } from 'relay-runtime';

export type ModuleSelectionInfos = {
  /**
   * The number of selected modules
   */
  nbSelectedModules: number;
  /**
   * If the selection contains all modules
   */
  selectionContainsAllModules: boolean;
  /**
   * If the selection contains hidden modules
   */
  selectionContainsHiddenModules: boolean;
};

export type ProfileScreenBodyProps = {
  /**
   * The card to display
   */
  profile: ProfileScreenBody_profile$key;
  /**
   * If the card is in editing mode
   */
  editing: boolean;
  /**
   * If the card is in selection mode
   */
  selectionMode: boolean;
  /**
   * A callback called when the number of rendered modules change
   */
  onModulesCountChange: (count: number) => void;
  /**
   * A callback called when the user press a module block in edit mode
   */
  onEditModule: (module: ModuleKind, moduleId: string) => void;
  /**
   * A callback called when the selection state change
   */
  onSelectionStateChange: (info: ModuleSelectionInfos) => void;
};

export type ProfileBodyHandle = {
  deleteSelectedModules: () => void;
  toggleSelectedModulesVisibility: (visible: boolean) => void;
  selectAllModules: () => void;
  unselectAllModules: () => void;
};

/**
 * The body of the profile screen
 * It display the modules of the card
 */
const ProfileScreenBody = (
  {
    profile,
    editing,
    selectionMode,
    onModulesCountChange,
    onEditModule,
    onSelectionStateChange,
  }: ProfileScreenBodyProps,
  forwardedRef: ForwardedRef<ProfileBodyHandle>,
): any => {
  // #region Relay
  const {
    id: profileId,
    cardModules,
    cardColors,
    cardStyle,
  } = useFragment(
    graphql`
      fragment ProfileScreenBody_profile on Profile {
        id
        cardModules {
          id
          visible
          ...ModuleData_cardModules
        }
        cardColors {
          primary
          light
          dark
        }
        cardStyle {
          borderColor
          borderRadius
          buttonRadius
          borderWidth
          buttonColor
          fontFamily
          fontSize
          gap
          titleFontFamily
          titleFontSize
        }
      }
    `,
    profile,
  );
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
        Object.keys(selectedModules).length === cardModules.length,
      selectionContainsHiddenModules: Object.keys(selectedModules).some(
        moduleId =>
          !cardModules.find(module => module?.id === moduleId)?.visible,
      ),
    });
  }, [selectedModules, onSelectionStateChange, cardModules]);

  useEffect(() => {
    onModulesCountChange(cardModules?.length ?? 0);
  }, [cardModules?.length, onModulesCountChange]);
  // #endregion

  // #region Modules mutations
  const [commitDeleteModules, deleteModulesActive] =
    useMutation<ProfileScreenBodyDeleteModuleMutation>(graphql`
      mutation ProfileScreenBodyDeleteModuleMutation(
        $input: DeleteModulesInput!
      ) {
        deleteModules(input: $input) {
          profile {
            id
          }
        }
      }
    `);

  const [commitDuplicateModule, duplicateModuleActive] =
    useMutation<ProfileScreenBodyDuplicateModuleMutation>(graphql`
      mutation ProfileScreenBodyDuplicateModuleMutation(
        $input: DuplicateModuleInput!
      ) {
        duplicateModule(input: $input) {
          createdModuleId
        }
      }
    `);

  const [commitUpdateModulesVisibility, updateModulesVisibilityActive] =
    useMutation<ProfileScreenBodyUpdateModulesVisibilityMutation>(graphql`
      mutation ProfileScreenBodyUpdateModulesVisibilityMutation(
        $input: UpdateModulesVisibilityInput!
      ) {
        updateModulesVisibility(input: $input) {
          profile {
            id
          }
        }
      }
    `);

  // #endregion

  // #region Modules reordering
  const [commitReorderModules, reorderModulesActive] =
    useMutation<ProfileScreenBodySwapModulesMutation>(graphql`
      mutation ProfileScreenBodySwapModulesMutation(
        $input: ReorderModulesInput!
      ) {
        reorderModules(input: $input) {
          profile {
            id
          }
        }
      }
    `);

  const moduleOrderUpdater = useCallback<(moduleIds: string[]) => StoreUpdater>(
    moduleIds => store => {
      const profileRecord = store.get(profileId);
      if (!profileRecord) {
        return;
      }
      const modulesRecord = profileRecord.getLinkedRecords('cardModules');
      if (!modulesRecord) {
        return;
      }
      const newModules = moduleIds.map(
        moduleId =>
          modulesRecord.find(
            moduleRecord => moduleRecord?.getDataID() === moduleId,
          ) ?? null,
      );
      profileRecord.setLinkedRecords(newModules, 'cardModules');
    },
    [profileId],
  );

  const [reorderPending, setReorderPending] = useState(false);
  const moduleOrderTimeoutRef = useRef<any>(null);
  const optimisticUpdate = useRef<Disposable | null>();
  const scheduleModuleOrderUpdate = useCallback(
    (moduleIds: string[]) => {
      if (moduleOrderTimeoutRef.current) {
        clearTimeout(moduleOrderTimeoutRef.current);
      }
      setReorderPending(true);
      moduleOrderTimeoutRef.current = setTimeout(() => {
        setReorderPending(false);
        moduleOrderTimeoutRef.current = null;
        const currentOptimisticUpdate = optimisticUpdate.current;
        const updater = moduleOrderUpdater(moduleIds);

        commitReorderModules({
          variables: {
            input: { moduleIds },
          },
          updater: store => {
            if (currentOptimisticUpdate === optimisticUpdate.current) {
              updater(store);
            }
          },
          optimisticUpdater: store => {
            if (currentOptimisticUpdate === optimisticUpdate.current) {
              updater(store);
            }
          },
          onCompleted() {
            if (currentOptimisticUpdate === optimisticUpdate.current) {
              currentOptimisticUpdate?.dispose();
              optimisticUpdate.current = null;
            }
          },
        });
      }, 2000);
    },
    [commitReorderModules, moduleOrderUpdater],
  );

  const environment = useRelayEnvironment();
  const canReorder = !deleteModulesActive && !duplicateModuleActive;
  const onMoveModule = useCallback(
    (moduleId: string, direction: 'down' | 'up') => {
      if (!canReorder) {
        return;
      }
      const moduleIndex = cardModules.findIndex(
        module => module?.id === moduleId,
      );
      if (moduleIndex === -1) {
        return;
      }
      const nextModuleIndex =
        direction === 'down' ? moduleIndex + 1 : moduleIndex - 1;
      if (nextModuleIndex < 0 || nextModuleIndex >= cardModules.length) {
        return;
      }
      const moduleIds = swap(
        cardModules.map(module => module.id),
        moduleIndex,
        nextModuleIndex,
      );
      const prevUpdate = optimisticUpdate.current;
      optimisticUpdate.current = environment.applyUpdate({
        storeUpdater: moduleOrderUpdater(moduleIds),
      });
      prevUpdate?.dispose();
      scheduleModuleOrderUpdate(moduleIds);
    },
    [
      canReorder,
      cardModules,
      environment,
      moduleOrderUpdater,
      scheduleModuleOrderUpdate,
    ],
  );
  // #endregion

  // #region Modules deletions
  const canDelete =
    !duplicateModuleActive &&
    !duplicateModuleActive &&
    !reorderPending &&
    !reorderModulesActive &&
    !updateModulesVisibilityActive;
  const deleteModules = useCallback(
    (modulesIds: string[]) => {
      if (canDelete) {
        return;
      }
      const updater: StoreUpdater = store => {
        const profileRecord = store.get(profileId);
        if (!profileRecord) {
          return;
        }
        const modulesRecord = profileRecord.getLinkedRecords('cardModules');
        if (!modulesRecord) {
          return;
        }
        const newModules = modulesRecord.filter(
          moduleRecord => !modulesIds.includes(moduleRecord?.getDataID()),
        );
        profileRecord.setLinkedRecords(newModules, 'cardModules');
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
    [canDelete, commitDeleteModules, profileId],
  );

  const onRemoveModule = useCallback(
    (moduleId: string) => {
      deleteModules([moduleId]);
    },
    [deleteModules],
  );
  // #endregion

  // #region Modules duplication
  const canDuplicate =
    !duplicateModuleActive &&
    !duplicateModuleActive &&
    !reorderPending &&
    !reorderModulesActive &&
    !updateModulesVisibilityActive;
  const onDuplicateModule = useCallback(
    (moduleId: string) => {
      if (canDuplicate) {
        return;
      }

      const updater = (
        store: RecordSourceSelectorProxy,
        newModuleId: string,
      ) => {
        const profileRecord = store.get(profileId);
        if (!profileRecord) {
          return;
        }
        let modules = profileRecord.getLinkedRecords('cardModules') ?? [];
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
        profileRecord.setLinkedRecords(modules, 'cardModules');
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
    [canDuplicate, commitDuplicateModule, profileId],
  );
  // #endregion

  // #region Modules visibility toggling
  const canUpdateVisibility = !deleteModulesActive && !duplicateModuleActive;
  const updateModulesVisibility = useCallback(
    (modulesIds: string[], visible: boolean) => {
      if (canUpdateVisibility) {
        return;
      }
      const updater: StoreUpdater = store => {
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
    [canUpdateVisibility, commitUpdateModulesVisibility],
  );

  const onToggleModuleVisibility = useCallback(
    (moduleId: string, visible: boolean) => {
      updateModulesVisibility([moduleId], visible);
    },
    [updateModulesVisibility],
  );
  // #endregion

  // #region Imperative handle
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
          cardModules.reduce(
            (acc, module) => {
              acc[module.id] = true;
              return acc;
            },
            {} as Record<string, boolean>,
          ),
        );
      },
      unselectAllModules() {
        setSelectedModules({});
      },
    }),
    [deleteModules, cardModules, selectedModules, updateModulesVisibility],
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

  const modulesData = useModulesData(cardModules);

  return modulesData.map((module, index) => (
    <ProfileBlockContainerMemo
      key={module.id}
      editing={editing}
      canMove={canReorder}
      canDelete={canDelete}
      canDuplicate={canDuplicate}
      canToggleVisibility={canUpdateVisibility}
      isFirst={index === 0}
      isLast={index === cardModules.length - 1}
      visible={module.visible}
      selectionMode={selectionMode}
      selected={!!selectedModules[module.id]}
      backgroundColor={cardColors?.light ?? '#fff'}
      // @ts-expect-error this extraData is used to trigger a re-render when the module data change
      extraData={{
        cardStyle,
        cardColors,
        module,
      }}
      {...getModuleCallbacks(module.id, module.kind as ModuleKind)}
    >
      <CardModuleRenderer
        module={module}
        colorPalette={cardColors}
        cardStyle={cardStyle}
      />
    </ProfileBlockContainerMemo>
  ));
};

export default memo(forwardRef(ProfileScreenBody));

// Perhaps a premature optimization, but with all the animations going on, it's better to memoize this component
// so that it doesn't re-render unnecessarily
const ProfileBlockContainerMemo = memo(ProfileBlockContainer, (prev, next) => {
  return isEqual(omit(prev, 'children'), omit(next, 'children'));
});
