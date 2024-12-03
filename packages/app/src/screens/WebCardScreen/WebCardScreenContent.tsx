import { Suspense, memo, useCallback, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useCurrentRoute, useRouter } from '#components/NativeRouter';
import WebCardBackground from '#components/WebCardBackgroundPreview';
import useBoolean from '#hooks/useBoolean';
import useToggle from '#hooks/useToggle';
import useCoverPlayPermission from '#screens/HomeScreen/useCoverPlayPermission';
import ActivityIndicator from '#ui/ActivityIndicator';
import AddContentBelowCoverModal from './AddContentBelowCoverModal';
import CardStyleModal from './CardStyleModal';
import LoadCardTemplateModal from './LoadCardTemplateModal';
import ModuleSelectionListModal from './ModuleSelectionListModal';
import PreviewModal from './PreviewModal';
import WebCardBlockContainer from './WebCardBlockContainer';
import WebCardColorsManager from './WebCardColorsManager';
import WebCardScreenBody from './WebCardScreenBody';
import WebCardScreenEditModeFooter, {
  WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT,
} from './WebCardScreenEditModeFooter';
import WebCardScreenFooter from './WebCardScreenFooter';
import WebCardScreenHeader from './WebCardScreenHeader';
import WebCardScreenScrollView from './WebCardScreenScrollView';
import { useEditTransition } from './WebCardScreenTransitions';
import type { WebCardScreenContent_webCard$key } from '#relayArtifacts/WebCardScreenContent_webCard.graphql';
import type {
  WebCardBodyHandle,
  ModuleSelectionInfos,
} from './WebCardScreenBody';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { ScrollView } from 'react-native-gesture-handler';

type WebCardScreenContentProps = {
  /**
   * The webCard to display.
   */
  webCard: WebCardScreenContent_webCard$key;
  /**
   * If the native screen is ready to be displayed.
   */
  ready: boolean;
  /**
   * If the webCard is in edit mode.
   */
  editing: boolean;
  /**
   * If the webCard can be edited.
   */
  isViewer: boolean;
  /**
   * If the webCard is in selection mode.
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
 * This component render the content of the Web card.
 */
const WebCardScreenContent = ({
  webCard: webCardKey,
  ready,
  editing,
  isViewer,
  selectionMode,
  onToggleSelectionMode,
  onToggleEditing: onToggleEditMode,
  onContentPositionChange,
}: WebCardScreenContentProps) => {
  // #region Data
  const webCard = useFragment(
    graphql`
      fragment WebCardScreenContent_webCard on WebCard {
        id
        userName
        ...CoverRenderer_webCard
        ...WebCardScreenHeader_webCard
        ...WebCardScreenBody_webCard
        ...WebCardColorPicker_webCard
        ...WebCardBackground_webCard
        ...WebCardBackgroundPreview_webCard
        ...PreviewModal_webCard
        ...LoadCardTemplateModal_webCard
        ...AddContentBelowCoverModal_webCard
        ...WebCardScreenEditModeFooter_webCard
        ...WebCardScreenFooter_webCard
        coverBackgroundColor
        cardColors {
          primary
          dark
          light
        }
      }
    `,
    webCardKey,
  );
  // #endregion

  // #region Navigation
  const router = useRouter();

  const route = useCurrentRoute();

  const fromCreation = useMemo(() => {
    if (route?.params && 'fromCreation' in route.params) {
      return route.params?.fromCreation ?? false;
    }

    return false;
  }, [route?.params]);

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
  const [
    showWebcardColorPicker,
    openWebcardColorPicker,
    closeWebcardColorPicker,
  ] = useBoolean(false);
  // #endregion

  // #region New Module
  const [showContentModal, toggleShowContentModal] = useToggle(false);

  const onAddContent = useCallback(() => {
    // @TODO: restore when templates are ready to be used instead of module picker
    // toggleShowContentModal()

    Toast.hide();
    setShowModulePicker(true);
  }, []);

  const [showModulePicker, setShowModulePicker] = useState(false);
  const onRequestNewModule = useCallback(() => {
    Toast.hide();
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
  const onEditModules = () => {
    Toast.hide();
    onToggleSelectionMode();
  };

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

  const webCardBodyRef = useRef<WebCardBodyHandle>(null);

  const onSelectAllModules = useCallback(() => {
    webCardBodyRef.current?.selectAllModules();
  }, []);

  const onUnSelectAllModules = useCallback(() => {
    webCardBodyRef.current?.unselectAllModules();
  }, []);

  const onDeleteSelectedModules = useCallback(() => {
    webCardBodyRef.current?.deleteSelectedModules();
    onToggleSelectionMode();
  }, [onToggleSelectionMode]);

  const onDuplicateSelectedModules = useCallback(() => {
    webCardBodyRef.current?.duplicateSelectedModules();
    onToggleSelectionMode();
  }, [onToggleSelectionMode]);

  const onToggleSelectedModulesVisibility = useCallback(
    (visible: boolean) => {
      webCardBodyRef.current?.toggleSelectedModulesVisibility(visible);
      onToggleSelectionMode();
    },
    [onToggleSelectionMode],
  );
  // #endregion

  //#region Load template

  const scrollViewRef = useRef<ScrollView>(null);
  const [loadTemplate, setLoadTemplate] = useState(false);
  const onTemplateModalClose = useCallback((templateLoaded: boolean) => {
    if (templateLoaded) {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }
    setLoadTemplate(false);
  }, []);
  //#endregion

  // #region Card style
  const [showCardStyleModal, setShowCardStyleModal] = useState(false);
  const openCardStyleModal = useCallback(() => {
    Toast.hide();
    setShowCardStyleModal(true);
  }, []);
  const closeCardStyleModal = useCallback(() => {
    setShowCardStyleModal(false);
  }, []);
  // #endregion

  // #region preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const openPreviewModal = useCallback(() => {
    Toast.hide();
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

  const coverBackgroundColor =
    swapColor(webCard.coverBackgroundColor, webCard.cardColors) ??
    webCard.cardColors?.light ??
    colors.white;

  const editTransition = useEditTransition();

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: editTransition?.value ? 0 : 1,
    };
  });

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const { canPlay, paused } = useCoverPlayPermission();

  return (
    <>
      <View style={styles.flex}>
        <Animated.View style={[styles.background, backgroundStyle]}>
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
            <WebCardBackground webCard={webCard} style={styles.flex} />
          </Suspense>
        </Animated.View>
        <Suspense>
          <WebCardScreenHeader
            webCard={webCard}
            editing={editing}
            nbSelectedModules={nbSelectedModules}
            selectionMode={selectionMode}
            selectionContainsAllModules={selectionContainsAllModules}
            onDone={onDone}
            onClose={onClose}
            onEditModules={onEditModules}
            onCancelEditModules={onToggleSelectionMode}
            onSelectAllModules={onSelectAllModules}
            onUnSelectAllModules={onUnSelectAllModules}
            disabledButtons={showWebcardColorPicker}
          />
        </Suspense>
        <WebCardScreenScrollView
          editing={editing}
          ref={scrollViewRef}
          allBlockLoaded={allBlockLoaded}
          onScroll={onScroll}
          editFooter={
            isViewer ? (
              <Suspense>
                <WebCardScreenEditModeFooter
                  fromCreation={fromCreation}
                  onAddContent={onAddContent}
                  onSkip={onDone}
                  webcard={webCard}
                />
              </Suspense>
            ) : null
          }
          editFooterHeight={WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT}
        >
          <WebCardBlockContainer
            id="cover"
            backgroundColor={coverBackgroundColor}
            editing={editing}
            displayEditionButtons={false}
            onModulePress={onEditCover}
          >
            <CoverRenderer
              webCard={webCard}
              width={windowWidth}
              canPlay={ready && canPlay}
              paused={paused}
              large
              useAnimationSnapshot
            />
          </WebCardBlockContainer>
          <Suspense
            fallback={
              <View
                style={{
                  height: 60,
                  maxHeight: windowHeight - windowWidth / COVER_RATIO,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator />
              </View>
            }
          >
            <WebCardScreenBody
              ref={webCardBodyRef}
              webCard={webCard}
              editing={editing}
              selectionMode={selectionMode}
              onEditModule={onEditModule}
              onSelectionStateChange={onSelectionStateChange}
              onLoad={onProfileBodyLoad}
            />
          </Suspense>
        </WebCardScreenScrollView>
        <Suspense fallback={null}>
          <WebCardScreenFooter
            editing={editing}
            selectionMode={selectionMode}
            hasSelectedModules={nbSelectedModules > 0}
            selectionContainsHiddenModules={selectionContainsHiddenModules}
            webCard={webCard}
            onRequestNewModule={onRequestNewModule}
            onRequestColorPicker={openWebcardColorPicker}
            onRequestWebCardStyle={openCardStyleModal}
            onRequestPreview={openPreviewModal}
            onDelete={onDeleteSelectedModules}
            onDuplicate={onDuplicateSelectedModules}
            onToggleVisibility={onToggleSelectedModulesVisibility}
          />
        </Suspense>
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
              webCard={webCard}
            />
            <CardStyleModal
              visible={showCardStyleModal}
              onRequestClose={closeCardStyleModal}
            />
            <LoadCardTemplateModal
              onClose={onTemplateModalClose}
              visible={loadTemplate}
              webCard={webCard}
            />
            <WebCardColorsManager
              webCard={webCard}
              visible={showWebcardColorPicker}
              onRequestClose={closeWebcardColorPicker}
              onCloseCanceled={openWebcardColorPicker}
            />
            <AddContentBelowCoverModal
              onClose={toggleShowContentModal}
              open={showContentModal}
              webCard={webCard}
            />
          </Suspense>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});

export default memo(WebCardScreenContent);
