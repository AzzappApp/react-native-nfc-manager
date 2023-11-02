import { Suspense, memo, useCallback, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter, useScreenHasFocus } from '#components/NativeRouter';
import WebCardBackground from '#components/WebCardBackground';
import WebCardColorPicker from '#components/WebCardColorPicker';
import CardStyleModal from './CardStyleModal';
import LoadCardTemplateModal from './LoadCardTemplateModal';
import ModuleSelectionListModal from './ModuleSelectionListModal';
import PreviewModal from './PreviewModal';
import ProfileBlockContainer from './ProfileBlockContainer';
import ProfileScreenBody from './ProfileScreenBody';
import ProfileScreenEditModeFooter, {
  PROFILE_SCREEN_EDIT_MODE_FOOTER_HEIGHT,
} from './ProfileScreenEditModeFooter';
import ProfileScreenFooter from './ProfileScreenFooter';
import ProfileScreenHeader from './ProfileScreenHeader';
import ProfileScreenScrollView from './ProfileScreenScrollView';
import { useEditTransition } from './ProfileScreenTransitions';
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
   * If the profile can be edited.
   */
  isViewer: boolean;
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
  isViewer,
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
        ...CoverRenderer_profile
        ...ProfileScreenBody_profile
        ...ProfileColorPicker_profile
        ...WebCardColorPicker_profile
        ...WebCardBackground_profile
        ...PreviewModal_viewer
        ...LoadCardTemplateModal_profile
        cardCover {
          backgroundColor
        }
        cardColors {
          primary
          dark
          light
        }
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
  const onDone = useCallback(() => {
    onToggleEditMode();
  }, [onToggleEditMode]);

  // #endregion

  // #region Color picker
  const [showWebcardColorPicker, setShowWebcardColorPicker] = useState(false);
  const onRequestWebcardColorPicker = useCallback(() => {
    setShowWebcardColorPicker(true);
  }, []);

  const onClosWebcardeColorPicker = useCallback(() => {
    setShowWebcardColorPicker(false);
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
  const [allBlockLoaded, setAllBlockLoaded] = useState(false);
  const onProfileBodyLoad = useCallback(() => {
    setAllBlockLoaded(true);
  }, []);

  const onEditModule = useCallback(
    (module: ModuleKind, moduleId: string) => {
      if (!MODULE_KINDS.includes(module)) {
        // unhanded module kind could be a future addition
        return;
      }
      //TODO: find a better way but with our router, the Toast is keep to(not an autohide toast)
      Toast.hide();
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
    //TODO: find a better way but with our router, the Toast is keep to(not an autohide toast)
    Toast.hide();
    router.push({
      route: 'COVER_EDITION',
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

  const onDuplicateSelectedModules = useCallback(() => {
    profileBodyRef.current?.duplicateSelectedModules();
    onToggleSelectionMode();
  }, [onToggleSelectionMode]);

  const onToggleSelectedModulesVisibility = useCallback(
    (visible: boolean) => {
      profileBodyRef.current?.toggleSelectedModulesVisibility(visible);
      onToggleSelectionMode();
    },
    [onToggleSelectionMode],
  );

  const [loadTemplate, setLoadTemplate] = useState(false);
  // #endregion

  // #region Card style
  const [showCardStyleModal, setShowCardStyleModal] = useState(false);
  const openCardStyleModal = useCallback(() => {
    setShowCardStyleModal(true);
  }, []);
  const closeCardStyleModal = useCallback(() => {
    setShowCardStyleModal(false);
  }, []);
  // #endregion

  // #region preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const openPreviewModal = useCallback(() => {
    setShowPreviewModal(true);
  }, []);
  const closePreviewModal = useCallback(() => {
    setShowPreviewModal(false);
  }, []);
  // #endregion

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const atTop = event.nativeEvent.contentOffset.y < 5;
      onContentPositionChange?.(atTop);
    },
    [onContentPositionChange],
  );

  const { width: windowSize } = useWindowDimensions();
  const coverBackgroundColor =
    swapColor(profile.cardCover?.backgroundColor, profile.cardColors) ??
    profile.cardColors?.light ??
    colors.white;

  const editTransiton = useEditTransition();

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - (editTransiton?.value ?? 0),
    };
  }, []);

  const hasFocus = useScreenHasFocus();

  return (
    <>
      <View style={{ flex: 1 }}>
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
          allBlockLoaded={allBlockLoaded}
          onScroll={onScroll}
          editFooter={
            <ProfileScreenEditModeFooter setLoadTemplate={setLoadTemplate} />
          }
          editFooterHeight={PROFILE_SCREEN_EDIT_MODE_FOOTER_HEIGHT}
        >
          <ProfileBlockContainer
            id="cover"
            index={0}
            backgroundColor={coverBackgroundColor}
            editing={editing}
            displayEditionButtons={false}
            onModulePress={onEditCover}
          >
            <CoverRenderer
              profile={profile}
              width={windowSize}
              videoEnabled={ready && hasFocus}
              hideBorderRadius
            />
          </ProfileBlockContainer>
          <Suspense fallback={null}>
            <ProfileScreenBody
              ref={profileBodyRef}
              profile={profile}
              editing={editing}
              selectionMode={selectionMode}
              onEditModule={onEditModule}
              onSelectionStateChange={onSelectionStateChange}
              onLoad={onProfileBodyLoad}
            />
          </Suspense>
        </ProfileScreenScrollView>
        <Suspense fallback={null}>
          <ProfileScreenFooter
            editing={editing}
            selectionMode={selectionMode}
            hasSelectedModules={nbSelectedModules > 0}
            selectionContainsHiddenModules={selectionContainsHiddenModules}
            profile={profile}
            onRequestNewModule={onRequestNewModule}
            onRequestColorPicker={onRequestWebcardColorPicker}
            onRequestWebcardStyle={openCardStyleModal}
            onRequestPreview={openPreviewModal}
            onDelete={onDeleteSelectedModules}
            onDuplicate={onDuplicateSelectedModules}
            onToggleVisibility={onToggleSelectedModulesVisibility}
          />
        </Suspense>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: -1,
            },
            backgroundStyle,
          ]}
        >
          <Suspense
            fallback={
              <View
                style={{
                  flex: 1,
                  backgroundColor: coverBackgroundColor,
                }}
              />
            }
          >
            <WebCardBackground profile={profile} style={{ flex: 1 }} />
          </Suspense>
        </Animated.View>
      </View>

      {isViewer && (
        <>
          <ModuleSelectionListModal
            visible={showModulePicker}
            onRequestClose={onCloseModulePicker}
            onSelectModuleKind={onSelectModuleKind}
            animationType="slide"
          />
          <Suspense fallback={null}>
            <PreviewModal
              visible={showPreviewModal}
              onRequestClose={closePreviewModal}
              profile={profile}
            />
            <CardStyleModal
              visible={showCardStyleModal}
              onRequestClose={closeCardStyleModal}
            />
            <LoadCardTemplateModal
              onClose={() => setLoadTemplate(false)}
              visible={loadTemplate}
              profile={profile}
            />
            <WebCardColorPicker
              profile={profile}
              visible={showWebcardColorPicker}
              onRequestClose={onClosWebcardeColorPicker}
            />
          </Suspense>
        </>
      )}
    </>
  );
};

export default memo(ProfileScreenContent);
