import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, useWindowDimensions } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { CARD_DEFAULT_BACKGROUND_COLOR } from '@azzapp/shared/cardHelpers';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import ProfileColorPicker from '#components/ProfileColorPicker';
import ModuleSelectionListModal from './ModuleSelectionListModal';
import ProfileBlockContainer from './ProfileBlockContainer';
import ProfileScreenBody from './ProfileScreenBody';
import ProfileScreenFooter from './ProfileScreenFooter';
import ProfileScreenHeader from './ProfileScreenHeader';
import ProfileScreenScrollView from './ProfileScreenScrollView';
import type {
  ProfileBodyHandle,
  ModuleSelectionInfos,
} from './ProfileScreenBody';
import type { ProfileScreenContent_profile$key } from '@azzapp/relay/artifacts/ProfileScreenContent_profile.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type ProfileScreenProps = {
  /**
   * The profile to display.
   */
  profile: ProfileScreenContent_profile$key;
  /**
   * If the native screen is ready to be displayed.
   */
  ready: boolean;
  /**
   * If the profile is in edit mode.
   */
  editing: boolean;
  /**
   * If the profile is in selection mode.
   */
  selectionMode: boolean;
  /**
   * A callback called when the user press the done button. in edit mode.
   */
  onToggleEditing: () => void;
  /**
   * A callback called when the use enter/exit selection mode.
   */
  onToggleSelectionMode: () => void;
  /**
   * A callback called when the user scroll the content.
   * (only called when the user is at the top or is not at the top anymore)
   * @param atTop true if the user is at the top of the content. false otherwise.
   */
  onContentPositionChange?: (atTop: boolean) => void;
};

/**
 * This component render the content of the profile Web card.
 */
const ProfileScreenContent = ({
  profile: profileKey,
  ready,
  editing,
  selectionMode,
  onToggleSelectionMode,
  onToggleEditing: onToggleEditMode,
  onContentPositionChange,
}: ProfileScreenProps) => {
  // #region Data
  const profile = useFragment(
    graphql`
      fragment ProfileScreenContent_profile on Profile {
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

  const onClose = useCallback(() => {
    router.back();
  }, [router]);
  // #endregion

  // #region Edition state

  const [editingDisplayMode, setEditingDisplayMode] = useState<
    'desktop' | 'mobile'
  >('mobile');

  const onDone = useCallback(() => {
    onToggleEditMode();
    setEditingDisplayMode('mobile');
  }, [onToggleEditMode]);

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
    mutation ProfileScreenContentUpdateCardMutation($input: UpdateCardInput!) {
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
    onToggleSelectionMode();
  }, [onToggleSelectionMode]);

  const onToggleSelectedModulesVisibility = useCallback(
    (visible: boolean) => {
      profileBodyRef.current?.toggleSelectedModulesVisibility(visible);
      onToggleSelectionMode();
    },
    [onToggleSelectionMode],
  );
  // #endregion

  const [modulesCount, setModulesCount] = useState(1);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const atTop = event.nativeEvent.contentOffset.y < 5;
      onContentPositionChange?.(atTop);
    },
    [onContentPositionChange],
  );

  const intl = useIntl();
  const { width: windowSize } = useWindowDimensions();

  return (
    <>
      <View style={{ flex: 1, backgroundColor }}>
        <ProfileScreenHeader
          editing={editing}
          nbSelectedModules={nbSelectedModules}
          selectionMode={selectionMode}
          selectionContainsAllModules={selectionContainsAllModules}
          onDone={onDone}
          onClose={onClose}
          onEditModules={onToggleSelectionMode}
          onCancelEditModules={onToggleSelectionMode}
          onSelectAllModules={onSelectAllModules}
          onUnSelectAllModules={onUnSelectAllModules}
        />
        <ProfileScreenScrollView
          editing={editing}
          ready={ready}
          blocksCount={modulesCount + 1}
          onScroll={onScroll}
        >
          <ProfileBlockContainer
            backgroundColor={backgroundColor}
            editing={editing}
            displayEditionButtons={false}
            onModulePress={onEditCover}
          >
            <CoverRenderer
              cover={profile.card?.cover}
              userName={profile.userName}
              width={windowSize}
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
                onModulesCountChange={setModulesCount}
              />
            )}
          </Suspense>
        </ProfileScreenScrollView>
        <ProfileScreenFooter
          editing={editing}
          currentEditionView={editingDisplayMode}
          selectionMode={selectionMode}
          hasSelectedModules={nbSelectedModules > 0}
          selectionContainsHiddenModules={selectionContainsHiddenModules}
          backgroundColor={backgroundColor}
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

export default ProfileScreenContent;
