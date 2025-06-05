import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, StyleSheet } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { colors } from '#theme';
import { useCoverUpload } from '#components/CoverEditor/CoverUploadContext';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter, useSuspendUntilAppear } from '#components/NativeRouter';
import { getRouteForCardModule } from '#helpers/cardModuleRouterHelpers';
import { TooltipProvider } from '#helpers/TooltipContext';
import { type ModuleKindWithVariant } from '#helpers/webcardModuleHelpers';
import useBoolean from '#hooks/useBoolean';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import {
  WebCardModuleTransitionSnapshotRenderer,
  type ModuleTransitionInfo,
} from '#screens/WebCardScreen/WebCardEditTransition';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Text from '#ui/Text';
import CardStyleModal from './CardStyleModal';
import LoadCardTemplateModal from './LoadCardTemplateModal';
import PreviewModal from './PreviewModal';
import Tooltips from './Tooltips';
import WebCardColorsManager from './WebCardColorsManager';
import WebCardEditBlockContainer from './WebCardEditBlockContainer';
import WebCardEditScreenBody from './WebCardEditScreenBody';
import WebCardEditScreenFooter from './WebCardEditScreenFooter';
import WebCardEditScreenHeader from './WebCardEditScreenHeader';
import { TRANSITIONS_DURATION } from './webCardEditScreenHelpers';
import WebCardEditScreenScrollView from './WebCardEditScreenScrollView';
import WebCardScreenEditModeFooter, {
  WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT,
} from './WebCardScreenEditModeFooter';
import type { WebCardEditScreen_webCard$key } from '#relayArtifacts/WebCardEditScreen_webCard.graphql';
import type { ChildPositionAwareScrollViewHandle } from '#ui/ChildPositionAwareScrollView';
import type {
  ModuleSelectionInfos,
  WebCardEditScreenBodyHandle,
} from './WebCardEditScreenBody';
import type { DerivedValue } from 'react-native-reanimated';

type WebCardEditScreenProps = {
  webCard: WebCardEditScreen_webCard$key;
  fromCreation: boolean;
  editing: boolean;
  editTransition: DerivedValue<number>;
  scrollViewRef: React.RefObject<ChildPositionAwareScrollViewHandle | null>;
  transitionInfos: Record<string, ModuleTransitionInfo> | null;
  onDone: () => void;
};

// This mmkv boolean is here to ensure we display the help toast only once
const MMKVS_HAS_DISPLAY_CONFIGURE_MODULE_TOAST =
  '@azzap/auth.hasDisplayConfigureModuleToast';

const storage = new MMKV();

const WebCardEditScreen = ({
  webCard: webCardKey,
  editing,
  fromCreation,
  scrollViewRef,
  editTransition,
  transitionInfos,
  onDone,
}: WebCardEditScreenProps) => {
  const webCard = useFragment(
    graphql`
      fragment WebCardEditScreen_webCard on WebCard {
        id
        userName
        coverBackgroundColor
        cardIsPublished
        cardColors {
          primary
          dark
          light
        }
        cardModules {
          id
        }
        ...WebCardEditScreenHeader_webCard
        ...CoverRenderer_webCard
        ...WebCardEditScreenBody_webCard
        ...WebCardScreenEditModeFooter_webCard
        ...WebCardEditScreenFooter_webCard
        ...PreviewModal_webCard
        ...LoadCardTemplateModal_webCard
        ...WebCardColorPicker_webCard
      }
    `,
    webCardKey,
  );

  useSuspendUntilAppear(!editing);

  // #region Routing
  const router = useRouter();

  // #endregion

  // #region New Module
  const onRequestNewModule = useCallback(() => {
    Toast.hide();
    router.push({
      route: 'ADD_MODULE_SECTION',
      params: { webCardId: webCardKey as unknown as string },
    });
  }, [router, webCardKey]);
  // #endregion

  // #region Module edition
  const onEditModule = useCallback(
    (module: ModuleKindWithVariant & { moduleId: string }) => {
      if (!MODULE_KINDS.includes(module.moduleKind)) {
        // unhanded module kind could be a future addition
        return;
      }
      //TODO: find a better way but with our router, the Toast is keep to(not an autohide toast)
      Toast.hide();
      const route = getRouteForCardModule(module);
      if (route) {
        router.push(route);
      }
    },
    [router],
  );

  const { coverUploadingData } = useCoverUpload();
  const onEditCover = useCallback(() => {
    //TODO: find a better way but with our router, the Toast is keep to(not an autohide toast)
    Toast.hide();
    if (coverUploadingData?.webCardId === webCard.id) {
      return;
    }
    router.push({
      route: 'COVER_EDITION',
    });
  }, [router, coverUploadingData?.webCardId, webCard.id]);
  // #endregion

  // #region Selection mode
  const [selectionMode, toggleSelectionMode] = useToggle(false);

  const selectionModeTransition = useSharedValue(0);
  useEffect(() => {
    selectionModeTransition.value = withTiming(selectionMode ? 1 : 0, {
      duration: TRANSITIONS_DURATION,
    });
  }, [selectionMode, selectionModeTransition]);

  const onEditModules = () => {
    Toast.hide();
    toggleSelectionMode();
  };

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

  const webCardBodyRef = useRef<WebCardEditScreenBodyHandle>(null);

  const onSelectAllModules = useCallback(() => {
    webCardBodyRef.current?.selectAllModules();
  }, []);

  const onUnSelectAllModules = useCallback(() => {
    webCardBodyRef.current?.unselectAllModules();
  }, []);

  const onDeleteSelectedModules = useCallback(() => {
    webCardBodyRef.current?.deleteSelectedModules();
    toggleSelectionMode();
  }, [toggleSelectionMode]);

  const confirmDeleteSection = () => {
    Alert.alert(
      intl.formatMessage(
        {
          defaultMessage: `Delete {count, plural,
          =1 {this section}
          other {these sections}
        }`,
          description: 'Title of delete sections Alert',
        },
        {
          count: nbSelectedModules,
        },
      ),
      intl.formatMessage(
        {
          defaultMessage: `Are you sure you want to delete {count, plural,
          =1 {this section}
          other {these sections}
        }? This action is irreversible.`,
          description: 'description of delete sections Alert',
        },
        {
          count: nbSelectedModules,
        },
      ),
      [
        {
          text: intl.formatMessage(
            {
              defaultMessage: `Delete {count, plural,
          =1 {this section}
          other {these sections}
        }`,
              description: 'button of delete sections Alert',
            },
            {
              count: nbSelectedModules,
            },
          ),
          onPress: onDeleteSelectedModules,
          style: 'destructive',
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Cancel button of delete sections Alert',
          }),
          isPreferred: true,
        },
      ],
    );
  };

  const onDuplicateSelectedModules = useCallback(() => {
    webCardBodyRef.current?.duplicateSelectedModules();
    toggleSelectionMode();
  }, [toggleSelectionMode]);

  const onToggleSelectedModulesVisibility = useCallback(
    (visible: boolean) => {
      webCardBodyRef.current?.toggleSelectedModulesVisibility(visible);
      toggleSelectionMode();
    },
    [toggleSelectionMode],
  );
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

  // #region Color picker
  const [
    showWebCardColorPicker,
    openWebCardColorPicker,
    closeWebCardColorPicker,
  ] = useBoolean(false);
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

  //#region Load template
  const [loadTemplate, setLoadTemplate] = useState(false);
  const onTemplateModalClose = useCallback(
    (templateLoaded: boolean) => {
      if (templateLoaded) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }
      setLoadTemplate(false);
    },
    [scrollViewRef],
  );
  //#endregion

  //#region Edit toast
  const intl = useIntl();
  const { bottom } = useScreenInsets();
  const wasEditing = useRef(false);
  useEffect(() => {
    if (editing === wasEditing.current) {
      return;
    }
    wasEditing.current = editing;

    // ensure we display the toast only once
    const hasDisplayConfigureModuleToast =
      storage.getBoolean(MMKVS_HAS_DISPLAY_CONFIGURE_MODULE_TOAST) ?? false;

    if (hasDisplayConfigureModuleToast) return;

    if (!webCard?.cardIsPublished && webCard?.cardModules?.length && editing) {
      storage.set(MMKVS_HAS_DISPLAY_CONFIGURE_MODULE_TOAST, true);

      Toast.show({
        type: 'info',
        bottomOffset: bottom + BOTTOM_MENU_HEIGHT,
        autoHide: false,
        text1: intl.formatMessage(
          {
            defaultMessage:
              'Tap on a section of your WebCard{azzappA} to modify it',
            description:
              'Toast info message that appears when the user is in webcard edit mode for the first time',
          },
          {
            azzappA: <Text variant="azzapp">a</Text>,
          },
        ) as unknown as string,
        props: {
          showClose: true,
        },
      });
    } else {
      Toast.hide();
    }

    return () => {
      Toast.hide();
    };
  }, [
    bottom,
    editing,
    intl,
    webCard?.cardIsPublished,
    webCard?.cardModules?.length,
  ]);
  //#endregion

  const { width: windowWidth } = useScreenDimensions();

  const coverBackgroundColor =
    swapColor(webCard?.coverBackgroundColor, webCard?.cardColors) ??
    webCard?.cardColors?.light ??
    colors.white;

  if (!webCard) {
    // TODO: handle error
    return null;
  }

  return (
    <TooltipProvider>
      <Container style={{ flex: 1 }}>
        <Suspense>
          <WebCardEditScreenHeader
            webCard={webCard}
            selectionMode={selectionMode}
            nbSelectedModules={nbSelectedModules}
            selectionContainsAllModules={selectionContainsAllModules}
            onDone={onDone}
            onEditModules={onEditModules}
            onCancelEditModules={toggleSelectionMode}
            onSelectAllModules={onSelectAllModules}
            onUnSelectAllModules={onUnSelectAllModules}
            disabledButtons={showWebCardColorPicker}
            editTransition={editTransition}
          />
        </Suspense>

        <WebCardEditScreenScrollView
          ref={scrollViewRef}
          editFooter={
            <Suspense>
              <WebCardScreenEditModeFooter
                fromCreation={!!fromCreation}
                onSkip={onDone}
                webCard={webCard}
              />
            </Suspense>
          }
          editFooterHeight={WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT}
          style={[
            StyleSheet.absoluteFill,
            { opacity: transitionInfos ? 0 : 1 },
          ]}
        >
          <WebCardEditBlockContainer
            id="cover"
            selectionModeTransition={selectionModeTransition}
            backgroundColor={coverBackgroundColor}
            displayEditionButtons={false}
            onModulePress={onEditCover}
          >
            <CoverRenderer
              webCard={webCard}
              width={windowWidth}
              canPlay={false}
              large
              useAnimationSnapshot={false}
            />
          </WebCardEditBlockContainer>
          <WebCardEditScreenBody
            ref={webCardBodyRef}
            webCard={webCard}
            selectionMode={selectionMode}
            onEditModule={onEditModule}
            onSelectionStateChange={onSelectionStateChange}
            selectionModeTransition={selectionModeTransition}
          />
        </WebCardEditScreenScrollView>
        {transitionInfos &&
          Object.entries(transitionInfos).map(([id, info]) => (
            <WebCardModuleTransitionSnapshotRenderer
              key={id}
              info={info}
              editTransition={editTransition}
            />
          ))}
        <Suspense fallback={null}>
          <WebCardEditScreenFooter
            selectionMode={selectionMode}
            selectionModeTransition={selectionModeTransition}
            hasSelectedModules={nbSelectedModules > 0}
            selectionContainsHiddenModules={selectionContainsHiddenModules}
            webCard={webCard}
            editTransition={editTransition}
            onRequestNewModule={onRequestNewModule}
            onRequestColorPicker={openWebCardColorPicker}
            onRequestWebCardStyle={openCardStyleModal}
            onRequestPreview={openPreviewModal}
            onDelete={confirmDeleteSection}
            onDuplicate={onDuplicateSelectedModules}
            onToggleVisibility={onToggleSelectedModulesVisibility}
          />
        </Suspense>
        <Suspense fallback={null}>
          <PreviewModal
            webCard={webCard}
            visible={showPreviewModal}
            onRequestClose={closePreviewModal}
          />
          <CardStyleModal
            visible={showCardStyleModal}
            onRequestClose={closeCardStyleModal}
          />
          <LoadCardTemplateModal
            webCard={webCard}
            onClose={onTemplateModalClose}
            visible={loadTemplate}
          />
          <WebCardColorsManager
            webCard={webCard}
            visible={showWebCardColorPicker}
            onRequestClose={closeWebCardColorPicker}
            onCloseCanceled={openWebCardColorPicker}
          />
        </Suspense>
      </Container>
      <Tooltips />
    </TooltipProvider>
  );
};
export default WebCardEditScreen;
