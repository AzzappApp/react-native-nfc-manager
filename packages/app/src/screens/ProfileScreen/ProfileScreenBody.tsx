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
  useState,
} from 'react';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
  MODULE_KIND_BLOCK_TEXT,
} from '@azzapp/shared/cardModuleHelpers';
import BlockTextRenderer from '#components/cardModules/BlockTextRenderer';
import CarouselRenderer from '#components/cardModules/CarouselRenderer';
import HorizontalPhotoRenderer from '#components/cardModules/HorizontalPhotoRenderer';
import LineDividerRenderer from '#components/cardModules/LineDividerRenderer';
import PhotoWithTextAndTitleRenderer from '#components/cardModules/PhotoWithTextAndTitleRenderer';
import SimpleButtonRenderer from '#components/cardModules/SimpleButtonRenderer';
import SocialLinksRenderer from '#components/cardModules/SocialLinksRenderer';
import { createId } from '#helpers/idHelpers';
import SimpleTextRenderer from '../../components/cardModules/SimpleTextRenderer';
import ProfileBlockContainer from './ProfileBlockContainer';
import type { ProfileScreenBody_profile$key } from '@azzapp/relay/artifacts/ProfileScreenBody_profile.graphql';
import type { ProfileScreenBodyDeleteModuleMutation } from '@azzapp/relay/artifacts/ProfileScreenBodyDeleteModuleMutation.graphql';
import type { ProfileScreenBodyDuplicateModuleMutation } from '@azzapp/relay/artifacts/ProfileScreenBodyDuplicateModuleMutation.graphql';
import type { ProfileScreenBodySwapModulesMutation } from '@azzapp/relay/artifacts/ProfileScreenBodySwapModulesMutation.graphql';
import type { ProfileScreenBodyUpdateModulesVisibilityMutation } from '@azzapp/relay/artifacts/ProfileScreenBodyUpdateModulesVisibilityMutation.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { ForwardedRef } from 'react';
import type {
  SelectorStoreUpdater,
  RecordSourceSelectorProxy,
} from 'relay-runtime';

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
          kind
          visible
          ...BlockTextRenderer_module
          ...PhotoWithTextAndTitleRenderer_module
          ...SocialLinksRenderer_module
          ...HorizontalPhotoRenderer_module
          ...SimpleButtonRenderer_module
          ...SimpleTextRenderer_module
          ...LineDividerRenderer_module
          ...CarouselRenderer_module
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

  useEffect(() => {
    onModulesCountChange(cardModules?.length ?? 0);
  }, [cardModules?.length, onModulesCountChange]);

  const [commitSwapModules, swapModulesActive] =
    useMutation<ProfileScreenBodySwapModulesMutation>(graphql`
      mutation ProfileScreenBodySwapModulesMutation($input: SwapModulesInput!) {
        swapModules(input: $input) {
          profile {
            id
          }
        }
      }
    `);

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
        Object.keys(selectedModules).length === cardModules.length,
      selectionContainsHiddenModules: Object.keys(selectedModules).some(
        moduleId =>
          !cardModules.find(module => module?.id === moduleId)?.visible,
      ),
    });
  }, [selectedModules, onSelectionStateChange, cardModules]);
  // #endregion

  // #region Modules manipulation
  const onMoveModule = useCallback(
    (moduleId: string, direction: 'down' | 'up') => {
      if (moduleMutationActive) {
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
      const nextModule = cardModules[nextModuleIndex];

      const updater: SelectorStoreUpdater<unknown> = store => {
        const profileRecord = store.get(profileId);
        if (!profileRecord) {
          return;
        }
        const modulesRecord = profileRecord.getLinkedRecords('cardModules');
        if (!modulesRecord) {
          return;
        }
        const newModules = [...modulesRecord];
        const moduleARecord = newModules[moduleIndex];
        const moduleBRecord = newModules[nextModuleIndex];
        newModules[moduleIndex] = moduleBRecord;
        newModules[nextModuleIndex] = moduleARecord;
        profileRecord.setLinkedRecords(newModules, 'cardModules');
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
    [commitSwapModules, moduleMutationActive, profileId, cardModules],
  );

  const deleteModules = useCallback(
    (modulesIds: string[]) => {
      if (moduleMutationActive) {
        return;
      }
      const updater: SelectorStoreUpdater<unknown> = store => {
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
    [profileId, commitDeleteModules, moduleMutationActive],
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
    [profileId, commitDuplicateModule, moduleMutationActive],
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

  return cardModules.map((module, index) => (
    <ProfileBlockContainerMemo
      key={module.id}
      editing={editing}
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
      {module.kind === MODULE_KIND_SIMPLE_TEXT && (
        <SimpleTextRenderer
          module={module}
          colorPalette={cardColors}
          cardStyle={cardStyle}
        />
      )}
      {module.kind === MODULE_KIND_SIMPLE_TITLE && (
        <SimpleTextRenderer
          module={module}
          colorPalette={cardColors}
          cardStyle={cardStyle}
        />
      )}
      {module.kind === MODULE_KIND_LINE_DIVIDER && (
        <LineDividerRenderer
          module={module}
          colorPalette={cardColors}
          cardStyle={cardStyle}
        />
      )}
      {module.kind === MODULE_KIND_HORIZONTAL_PHOTO && (
        <HorizontalPhotoRenderer
          module={module}
          colorPalette={cardColors}
          cardStyle={cardStyle}
        />
      )}
      {module.kind === MODULE_KIND_CAROUSEL && (
        <CarouselRenderer
          module={module}
          colorPalette={cardColors}
          cardStyle={cardStyle}
        />
      )}
      {module.kind === MODULE_KIND_SIMPLE_BUTTON && (
        <SimpleButtonRenderer
          module={module}
          colorPalette={cardColors}
          cardStyle={cardStyle}
        />
      )}
      {module.kind === MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE && (
        <PhotoWithTextAndTitleRenderer
          module={module}
          colorPalette={cardColors}
          cardStyle={cardStyle}
        />
      )}
      {module.kind === MODULE_KIND_SOCIAL_LINKS && (
        <SocialLinksRenderer
          module={module}
          colorPalette={cardColors}
          cardStyle={cardStyle}
        />
      )}
      {module.kind === MODULE_KIND_BLOCK_TEXT && (
        <BlockTextRenderer
          module={module}
          colorPalette={cardColors}
          cardStyle={cardStyle}
        />
      )}
    </ProfileBlockContainerMemo>
  ));
};

export default memo(forwardRef(ProfileScreenBody));

// Perhaps a premature optimization, but with all the animations going on, it's better to memoize this component
// so that it doesn't re-render unnecessarily
const ProfileBlockContainerMemo = memo(ProfileBlockContainer, (prev, next) => {
  return isEqual(omit(prev, 'children'), omit(next, 'children'));
});
