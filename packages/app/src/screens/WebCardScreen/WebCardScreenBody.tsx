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
import { useIntl } from 'react-intl';
import { Platform, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  graphql,
  useFragment,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { swap } from '@azzapp/shared/arrayHelpers';
import { moduleCountRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import CardModuleRenderer from '#components/cardModules/CardModuleRenderer';
import { useModulesData } from '#components/cardModules/ModuleData';
import { useRouter, useSuspendUntilAppear } from '#components/NativeRouter';
import { createId } from '#helpers/idHelpers';
import ActivityIndicator from '#ui/ActivityIndicator';
import WebCardBlockContainer from './WebCardBlockContainer';
import type { WebCardScreenBody_webCard$key } from '#relayArtifacts/WebCardScreenBody_webCard.graphql';
import type { WebCardScreenBodyDeleteModuleMutation } from '#relayArtifacts/WebCardScreenBodyDeleteModuleMutation.graphql';
import type {
  WebCardScreenBodyDuplicateModuleMutation,
  WebCardScreenBodyDuplicateModuleMutation$data,
} from '#relayArtifacts/WebCardScreenBodyDuplicateModuleMutation.graphql';
import type { WebCardScreenBodySwapModulesMutation } from '#relayArtifacts/WebCardScreenBodySwapModulesMutation.graphql';
import type { WebCardScreenBodyUpdateModulesVisibilityMutation } from '#relayArtifacts/WebCardScreenBodyUpdateModulesVisibilityMutation.graphql';
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

export type WebCardScreenBodyProps = {
  /**
   * The card to display
   */
  webCard: WebCardScreenBody_webCard$key;
  /**
   * If the card is in editing mode
   */
  editing: boolean;
  /**
   * If the card is in selection mode
   */
  selectionMode: boolean;
  /**
   * A callback called when the user press a module block in edit mode
   */
  onEditModule: (module: ModuleKind, moduleId: string) => void;
  /**
   * A callback called when the selection state change
   */
  onSelectionStateChange: (info: ModuleSelectionInfos) => void;
  /**
   * A callback called when the body is loaded
   */
  onLoad: () => void;
};

export type WebCardBodyHandle = {
  deleteSelectedModules: () => void;
  duplicateSelectedModules: () => void;
  toggleSelectedModulesVisibility: (visible: boolean) => void;
  selectAllModules: () => void;
  unselectAllModules: () => void;
};

const TEMP_ID_PREFIX = 'temp';

/**
 * The body of the webCard screen
 * It display the modules of the card
 */
const WebCardScreenBody = (
  {
    webCard,
    editing,
    selectionMode,
    onEditModule,
    onSelectionStateChange,
    onLoad,
  }: WebCardScreenBodyProps,
  forwardedRef: ForwardedRef<WebCardBodyHandle>,
): any => {
  // #region Relay
  const {
    id: webCardId,
    cardModules,
    cardColors,
    cardStyle,
    cardIsPublished,
    isPremium,
    coverBackgroundColor,
  } = useFragment(
    graphql`
      fragment WebCardScreenBody_webCard on WebCard {
        id
        coverBackgroundColor
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
        cardIsPublished
        isPremium
      }
    `,
    webCard,
  );

  useSuspendUntilAppear(Platform.OS === 'android');

  useEffect(() => {
    onLoad();
  }, [onLoad]);
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
  // #endregion

  // #region Modules mutations
  const [commitDeleteModules, deleteModulesActive] =
    useMutation<WebCardScreenBodyDeleteModuleMutation>(graphql`
      mutation WebCardScreenBodyDeleteModuleMutation(
        $webCardId: ID!
        $input: DeleteModulesInput!
      ) {
        deleteModules(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
          }
        }
      }
    `);

  const [commitDuplicateModule, duplicateModuleActive] =
    useMutation<WebCardScreenBodyDuplicateModuleMutation>(graphql`
      mutation WebCardScreenBodyDuplicateModuleMutation(
        $webCardId: ID!
        $input: DuplicateModuleInput!
      ) {
        duplicateModule(webCardId: $webCardId, input: $input) {
          createdModules {
            originalModuleId
            newModuleId
          }
          webCard {
            id
            requiresSubscription
          }
        }
      }
    `);

  const [commitUpdateModulesVisibility, updateModulesVisibilityActive] =
    useMutation<WebCardScreenBodyUpdateModulesVisibilityMutation>(graphql`
      mutation WebCardScreenBodyUpdateModulesVisibilityMutation(
        $webCardId: ID!
        $input: UpdateModulesVisibilityInput!
      ) {
        updateModulesVisibility(webCardId: $webCardId, input: $input) {
          webCard {
            id
          }
        }
      }
    `);

  // #endregion
  const intl = useIntl();

  // #region Modules reordering
  const [commitReorderModules, reorderModulesActive] =
    useMutation<WebCardScreenBodySwapModulesMutation>(graphql`
      mutation WebCardScreenBodySwapModulesMutation(
        $webCardId: ID!
        $input: ReorderModulesInput!
      ) {
        reorderModules(webCardId: $webCardId, input: $input) {
          webCard {
            id
          }
        }
      }
    `);

  const moduleOrderUpdater = useCallback<(moduleIds: string[]) => StoreUpdater>(
    moduleIds => store => {
      const webCardRecord = store.get(webCardId);
      if (!webCardRecord) {
        return;
      }
      const modulesRecord = webCardRecord.getLinkedRecords('cardModules');
      if (!modulesRecord) {
        return;
      }
      const newModules = moduleIds.map(
        moduleId =>
          modulesRecord.find(
            moduleRecord => moduleRecord?.getDataID() === moduleId,
          ) ?? null,
      );
      webCardRecord.setLinkedRecords(newModules, 'cardModules');
    },
    [webCardId],
  );

  const [reorderPending, setReorderPending] = useState(false);
  const moduleOrderTimeoutRef = useRef<any>(null);
  const optimisticUpdate = useRef<Disposable | null>();
  const scheduleModuleOrderUpdate = useCallback(
    (modulesIds: string[]) => {
      if (moduleOrderTimeoutRef.current) {
        clearTimeout(moduleOrderTimeoutRef.current);
      }
      setReorderPending(true);
      moduleOrderTimeoutRef.current = setTimeout(() => {
        setReorderPending(false);
        moduleOrderTimeoutRef.current = null;
        const currentOptimisticUpdate = optimisticUpdate.current;
        const updater = moduleOrderUpdater(modulesIds);

        commitReorderModules({
          variables: {
            webCardId,
            input: { modulesIds },
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
          onError(error) {
            console.error(error);
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage: 'Error, could not reorder the modules',
                description: 'Reorder modules error toast',
              }),
            });
          },
        });
      }, 2000);
    },
    [moduleOrderUpdater, commitReorderModules, webCardId, intl],
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
    !deleteModulesActive &&
    !duplicateModuleActive &&
    !reorderPending &&
    !reorderModulesActive &&
    !updateModulesVisibilityActive;
  const deleteModules = useCallback(
    (modulesIds: string[]) => {
      if (!canDelete) {
        return;
      }
      const updater: StoreUpdater = store => {
        const webCardRecord = store.get(webCardId);
        if (!webCardRecord) {
          return;
        }
        const modulesRecord = webCardRecord.getLinkedRecords('cardModules');
        if (!modulesRecord) {
          return;
        }
        const newModules = modulesRecord.filter(
          moduleRecord => !modulesIds.includes(moduleRecord?.getDataID()),
        );
        webCardRecord.setLinkedRecords(newModules, 'cardModules');
      };
      commitDeleteModules({
        variables: {
          webCardId,
          input: {
            modulesIds,
          },
        },
        updater,
        optimisticUpdater: updater,
        onError(error) {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could not delete the modules',
              description: 'Delete modules error toast',
            }),
          });
        },
      });
    },
    [canDelete, commitDeleteModules, webCardId, intl],
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
    !deleteModulesActive &&
    !reorderPending &&
    !reorderModulesActive &&
    !updateModulesVisibilityActive;

  const duplicateModules = useCallback(
    (modulesIds: string[]) => {
      if (!canDuplicate) {
        return;
      }

      const updater = (
        store: RecordSourceSelectorProxy,
        createdModules: WebCardScreenBodyDuplicateModuleMutation$data['duplicateModule']['createdModules'],
      ) => {
        const webCardRecord = store.get(webCardId);
        if (!webCardRecord) {
          return;
        }
        const modules = webCardRecord.getLinkedRecords('cardModules') ?? [];

        const maxPosition = Math.max(
          ...[...createdModules].map(c =>
            modules.findIndex(
              moduleRecord => moduleRecord?.getDataID() === c.originalModuleId,
            ),
          ),
        );

        [...createdModules]
          .sort((a, b) => {
            const aModuleRecordIndex = modules.findIndex(
              moduleRecord => moduleRecord?.getDataID() === a.originalModuleId,
            );

            const bModuleRecordIndex = modules.findIndex(
              moduleRecord => moduleRecord?.getDataID() === b.originalModuleId,
            );

            return aModuleRecordIndex - bModuleRecordIndex;
          })
          .forEach(({ originalModuleId, newModuleId }, index) => {
            const moduleRecordIndex = modules.findIndex(
              moduleRecord => moduleRecord?.getDataID() === originalModuleId,
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
            modules.splice(maxPosition + index + 1, 0, newModuleRecord);
          });
        webCardRecord.setLinkedRecords(modules, 'cardModules');
      };

      const optimisticModuleIds = modulesIds.map(mId => ({
        originalModuleId: mId,
        newModuleId: `${TEMP_ID_PREFIX}-${createId()}`,
      }));

      commitDuplicateModule({
        variables: {
          webCardId,
          input: {
            modulesIds,
          },
        },
        updater(store, response) {
          const createdModules = response?.duplicateModule?.createdModules;
          if (!createdModules) {
            return;
          }
          updater(store, createdModules);
        },
        optimisticUpdater(store) {
          updater(store, optimisticModuleIds);
        },
        onError(error) {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could not duplicate the module',
              description: 'Duplicate module error toast',
            }),
          });
        },
      });
    },
    [canDuplicate, commitDuplicateModule, intl, webCardId],
  );
  const router = useRouter();
  const onDuplicateModule = useCallback(
    (moduleId: string) => {
      const requireSubscription = moduleCountRequiresSubscription(
        cardModules.length + 1,
      );
      if (cardIsPublished && requireSubscription && !isPremium) {
        router.push({ route: 'USER_PAY_WALL' });
        return;
      }
      duplicateModules([moduleId]);
    },
    [cardIsPublished, cardModules.length, duplicateModules, isPremium, router],
  );
  // #endregion

  // #region Modules visibility toggling
  const canUpdateVisibility = !deleteModulesActive && !duplicateModuleActive;
  const updateModulesVisibility = useCallback(
    (modulesIds: string[], visible: boolean) => {
      if (!canUpdateVisibility) {
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
          webCardId,
          input: {
            modulesIds,
            visible,
          },
        },
        updater,
        optimisticUpdater: updater,
        onError(error) {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could not update the modules visibility',
              description: 'Update modules visibility error toast',
            }),
          });
        },
      });
    },
    [canUpdateVisibility, commitUpdateModulesVisibility, intl, webCardId],
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
      duplicateSelectedModules() {
        duplicateModules(Object.keys(selectedModules));
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
    [
      deleteModules,
      duplicateModules,
      cardModules,
      selectedModules,
      updateModulesVisibility,
    ],
  );
  //#endregion

  // see @ProfileBlockContainerMemo
  const getModuleCallbacks = useMemo(
    () =>
      memoize((id: string, kind: ModuleKind) => ({
        onModulePress() {
          if (!id.includes(TEMP_ID_PREFIX)) {
            Toast.hide();
            onEditModule(kind, id);
          }
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

  return modulesData.map((module, index) => {
    const blockId = module.id;

    return (
      <WebCardBlockContainerMemo
        key={blockId}
        id={blockId}
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
          coverBackgroundColor={coverBackgroundColor}
        />
        {blockId.includes(TEMP_ID_PREFIX) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" style={styles.loading} />
          </View>
        )}
      </WebCardBlockContainerMemo>
    );
  });
};

export default memo(forwardRef(WebCardScreenBody));

// Perhaps a premature optimization, but with all the animations going on, it's better to memoize this component
// so that it doesn't re-render unnecessarily
const WebCardBlockContainerMemo = memo(WebCardBlockContainer, (prev, next) => {
  return isEqual(omit(prev, 'children'), omit(next, 'children'));
});

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: `${colors.grey400}4D`,
  },
  loading: {
    width: 60,
    height: 60,
  },
});
