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
import {
  Platform,
  StyleSheet,
  View,
  Animated as RNAnimated,
} from 'react-native';
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
import {
  isModuleVariantSupported,
  type ModuleKindWithVariant,
} from '#helpers/webcardModuleHelpers';
import useScreenDimensions from '#hooks/useScreenDimensions';
import ActivityIndicator from '#ui/ActivityIndicator';
import WebCardEditBlockContainer from './WebCardEditBlockContainer';
import type { ModuleRenderInfo } from '#components/cardModules/CardModuleRenderer';
import type { WebCardEditScreenBody_webCard$key } from '#relayArtifacts/WebCardEditScreenBody_webCard.graphql';
import type { WebCardEditScreenBodyDeleteModuleMutation } from '#relayArtifacts/WebCardEditScreenBodyDeleteModuleMutation.graphql';
import type {
  WebCardEditScreenBodyDuplicateModuleMutation,
  WebCardEditScreenBodyDuplicateModuleMutation$data,
} from '#relayArtifacts/WebCardEditScreenBodyDuplicateModuleMutation.graphql';
import type { WebCardEditScreenBodySwapModulesMutation } from '#relayArtifacts/WebCardEditScreenBodySwapModulesMutation.graphql';
import type { WebCardEditScreenBodyUpdateModulesVisibilityMutation } from '#relayArtifacts/WebCardEditScreenBodyUpdateModulesVisibilityMutation.graphql';
import type { WebCardEditBlockContainerProps } from './WebCardEditBlockContainer';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ForwardedRef } from 'react';
import type { DerivedValue } from 'react-native-reanimated';
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

export type WebCardEditScreenBodyProps = {
  /**
   * The card to display
   */
  webCard: WebCardEditScreenBody_webCard$key;
  /**
   * If the card is in selection mode
   */
  selectionMode: boolean;
  /**
   * A shared value representing the selectionMode animation progress
   */
  selectionModeTransition: DerivedValue<number>;
  /**
   * Wether the edit screen is displayed
   */
  editing: boolean;
  /**
   * A callback called when the user press a module block in edit mode
   */
  onEditModule: (module: ModuleKindWithVariant & { moduleId: string }) => void;
  /**
   * A callback called when the selection state change
   */
  onSelectionStateChange: (info: ModuleSelectionInfos) => void;
  /**
   * A callback called when the body is loaded
   */
  onLoad?: () => void;
};

export type WebCardEditScreenBodyHandle = {
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
const WebCardEditScreenBody = (
  {
    webCard,
    selectionMode,
    selectionModeTransition,
    editing,
    onEditModule,
    onSelectionStateChange,
    onLoad,
  }: WebCardEditScreenBodyProps,
  forwardedRef: ForwardedRef<WebCardEditScreenBodyHandle>,
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
      fragment WebCardEditScreenBody_webCard on WebCard {
        id
        coverBackgroundColor
        cardModules {
          id
          visible
          variant
          kind
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

  const cardModuleFiltered = useMemo(() => {
    return cardModules.filter(module =>
      isModuleVariantSupported({
        moduleKind: module.kind,
        variant: module.variant,
      }),
    );
  }, [cardModules]);

  useSuspendUntilAppear(Platform.OS === 'android');

  useEffect(() => {
    onLoad?.();
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
        Object.keys(selectedModules).length === cardModuleFiltered.length,
      selectionContainsHiddenModules: Object.keys(selectedModules).some(
        moduleId =>
          !cardModuleFiltered.find(module => module?.id === moduleId)?.visible,
      ),
    });
  }, [selectedModules, onSelectionStateChange, cardModuleFiltered]);
  // #endregion

  // #region Modules mutations
  const [commitDeleteModules, deleteModulesActive] =
    useMutation<WebCardEditScreenBodyDeleteModuleMutation>(graphql`
      mutation WebCardEditScreenBodyDeleteModuleMutation(
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
    useMutation<WebCardEditScreenBodyDuplicateModuleMutation>(graphql`
      mutation WebCardEditScreenBodyDuplicateModuleMutation(
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
    useMutation<WebCardEditScreenBodyUpdateModulesVisibilityMutation>(graphql`
      mutation WebCardEditScreenBodyUpdateModulesVisibilityMutation(
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
    useMutation<WebCardEditScreenBodySwapModulesMutation>(graphql`
      mutation WebCardEditScreenBodySwapModulesMutation(
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

  useEffect(() => {
    return () => {
      clearTimeout(moduleOrderTimeoutRef.current);
    };
  }, []);

  const environment = useRelayEnvironment();
  const canReorder = !deleteModulesActive && !duplicateModuleActive;
  const onMoveModule = useCallback(
    (moduleId: string, direction: 'down' | 'up') => {
      if (!canReorder) {
        return;
      }
      const moduleIndex = cardModuleFiltered.findIndex(
        module => module?.id === moduleId,
      );
      if (moduleIndex === -1) {
        return;
      }
      const nextModuleIndex =
        direction === 'down' ? moduleIndex + 1 : moduleIndex - 1;
      if (nextModuleIndex < 0 || nextModuleIndex >= cardModuleFiltered.length) {
        return;
      }
      const moduleIds = swap(
        cardModuleFiltered.map(module => module.id),
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
      cardModuleFiltered,
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
        createdModules: WebCardEditScreenBodyDuplicateModuleMutation$data['duplicateModule']['createdModules'],
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
        cardModuleFiltered.length + 1,
      );
      if (cardIsPublished && requireSubscription && !isPremium) {
        router.push({ route: 'USER_PAY_WALL' });
        return;
      }
      duplicateModules([moduleId]);
    },
    [
      cardIsPublished,
      cardModuleFiltered.length,
      duplicateModules,
      isPremium,
      router,
    ],
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
          cardModuleFiltered.reduce(
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
      cardModuleFiltered,
      selectedModules,
      updateModulesVisibility,
    ],
  );
  //#endregion

  // see @ProfileBlockContainerMemo
  const getModuleCallbacks = useMemo(
    () =>
      memoize((module: ModuleKindWithVariant & { moduleId: string }) => ({
        onModulePress() {
          if (!module.moduleId.includes(TEMP_ID_PREFIX)) {
            Toast.hide();
            onEditModule(module);
          }
        },
        onDuplicate() {
          onDuplicateModule(module.moduleId);
        },
        onRemove() {
          onRemoveModule(module.moduleId);
        },
        onMoveUp() {
          onMoveModule(module.moduleId, 'up');
        },
        onMoveDown() {
          onMoveModule(module.moduleId, 'down');
        },
        onToggleVisibility(visible: boolean) {
          onToggleModuleVisibility(module.moduleId, visible);
        },
        onSelect(selected: boolean) {
          onSelectModule(module.moduleId, selected);
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

  const scrollPosition = useRef(new RNAnimated.Value(0)).current;

  return modulesData.map((module, index) => {
    const blockId = module.id;

    return (
      <WebCardModule
        key={blockId}
        module={module}
        canMove={canReorder}
        canDelete={canDelete}
        canDuplicate={canDuplicate}
        canToggleVisibility={canUpdateVisibility}
        isFirst={index === 0}
        isLast={index === cardModuleFiltered.length - 1}
        visible={module.visible}
        selectionMode={selectionMode}
        selected={!!selectedModules[module.id]}
        backgroundColor={cardColors?.light ?? '#fff'}
        cardColors={cardColors}
        cardStyle={cardStyle}
        coverBackgroundColor={coverBackgroundColor}
        scrollPosition={scrollPosition}
        selectionModeTransition={selectionModeTransition}
        editing={editing}
        {...getModuleCallbacks({
          moduleId: module.id,
          moduleKind: module.kind,
          variant: module.variant,
        } as ModuleKindWithVariant & { moduleId: string })}
      />
    );
  });
};

const WebCardModule = ({
  module,
  cardColors,
  cardStyle,
  coverBackgroundColor,
  scrollPosition,
  editing,
  ...props
}: Omit<WebCardEditBlockContainerProps, 'children' | 'id'> & {
  module: ModuleRenderInfo & { id: string; visible: boolean };
  cardColors?: ColorPalette | null;
  cardStyle?: CardStyle | null;
  coverBackgroundColor?: string | null;
  editing: boolean;
  scrollPosition: RNAnimated.Value;
}) => {
  const { height: screenHeight } = useScreenDimensions();
  return (
    <WebCardEditBlockContainerMemo
      id={module.id}
      {...props}
      maxEditHeight={screenHeight}
      extraData={{
        cardStyle,
        cardColors,
        module,
      }}
    >
      <CardModuleRenderer
        module={module}
        colorPalette={cardColors}
        cardStyle={cardStyle}
        coverBackgroundColor={coverBackgroundColor}
        scrollPosition={scrollPosition}
        modulePosition={0}
        webCardViewMode="edit"
        canPlay={editing}
      />
      {module.id.includes(TEMP_ID_PREFIX) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="white" style={styles.loading} />
        </View>
      )}
    </WebCardEditBlockContainerMemo>
  );
};

export default memo(forwardRef(WebCardEditScreenBody));

// Perhaps a premature optimization, but with all the animations going on, it's better to memoize this component
// so that it doesn't re-render unnecessarily
const WebCardEditBlockContainerMemo: React.FC<
  WebCardEditBlockContainerProps & {
    extraData?: any;
  }
> = memo(WebCardEditBlockContainer, (prev, next) => {
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
