import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery, useRelayEnvironment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import { getRouteForCardModule } from '#helpers/cardModuleRouterHelpers';
import relayScreen from '#helpers/relayScreen';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import {
  MODULE_VARIANT_SECTION,
  type ModuleKindWithVariant,
} from '#helpers/webcardModuleHelpers';
import useBoolean from '#hooks/useBoolean';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Text from '#ui/Text';
import AddModuleSectionModal from './AddModuleSection';
import CardStyleModal from './CardStyleModal';
import LoadCardTemplateModal from './LoadCardTemplateModal';
import PreviewModal from './PreviewModal';
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
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WebCardEditScreenQuery } from '#relayArtifacts/WebCardEditScreenQuery.graphql';
import type { WebCardEditRoute, WebCardRoute } from '#routes';
import type { ChildPositionAwareScrollViewHandle } from '#ui/ChildPositionAwareScrollView';
import type {
  ModuleSelectionInfos,
  WebCardEditScreenBodyHandle,
} from './WebCardEditScreenBody';

const query = graphql`
  query WebCardEditScreenQuery($webCardId: ID!) {
    node(id: $webCardId) {
      ... on WebCard {
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
      }
      ...WebCardEditScreenHeader_webCard
      ...CoverRenderer_webCard
      ...WebCardEditScreenBody_webCard
      ...WebCardScreenEditModeFooter_webCard
      ...WebCardEditScreenFooter_webCard
      ...PreviewModal_webCard
      ...LoadCardTemplateModal_webCard
      ...WebCardColorPicker_webCard
      ...AddModuleSectionModal_webCard
    }
  }
`;

const WebCardEditScreen = ({
  preloadedQuery,
  route: {
    params: { fromCreation, scrollPosition },
  },
}: RelayScreenProps<WebCardEditRoute, WebCardEditScreenQuery>) => {
  const data = usePreloadedQuery(query, preloadedQuery);
  const webCard = data.node;

  const scrollViewRef = useRef<ChildPositionAwareScrollViewHandle>(null);

  useEffect(() => {
    let timeout: any;
    if (scrollPosition) {
      timeout = setTimeout(() => {
        scrollViewRef.current?.scrollToChild({
          childId: scrollPosition.moduleId,
          y: scrollPosition.y,
          animated: false,
        });
      }, 100);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [scrollPosition]);

  // #region Routing
  const router = useRouter();

  const onDone = useCallback(async () => {
    const scrollPosition = await scrollViewRef.current?.getScrollPosition();
    const scrollPositionParam = scrollPosition
      ? {
          moduleId: scrollPosition.childId,
          y: scrollPosition.y,
        }
      : undefined;
    const routerState = router.getCurrentRouterState();
    const previousRoute = routerState?.stack[routerState?.stack.length - 2];
    if (
      previousRoute?.kind === 'route' &&
      previousRoute?.state.route === 'WEBCARD'
    ) {
      const webCardRoute = previousRoute.state as WebCardRoute;
      const id = previousRoute.id;
      router.splice(
        {
          // @ts-expect-error id is voluntary not typed in the route type
          // this is a hack to avoid having to communicate the id of the webcard in two different ways
          id,
          route: 'WEBCARD',
          params: {
            ...webCardRoute.params,
            scrollPosition: scrollPositionParam,
            fromEditing: true,
          },
        },
        2,
      );
      return;
    }
    if (webCard && webCard.userName) {
      router.replace({
        route: 'WEBCARD',
        params: {
          webCardId: webCard.id,
          userName: webCard.userName,
          scrollPosition: scrollPositionParam,
          fromEditing: true,
        },
      });
    }
  }, [router, webCard]);

  const prefetchRoute = usePrefetchRoute();
  const environment = useRelayEnvironment();
  useEffect(() => {
    const disposables = [
      prefetchRoute(environment, {
        route: 'COVER_EDITION',
      }),
      ...MODULE_VARIANT_SECTION.flatMap(module =>
        module.section === 'custom'
          ? module.moduleKind.map(moduleKind => {
              const module = { moduleKind } as ModuleKindWithVariant;
              const route = getRouteForCardModule(module);
              if (!route) return undefined;
              return prefetchRoute(environment, route);
            })
          : module.variants.map(v => {
              const route = getRouteForCardModule({
                moduleKind: module.section,
                variant: v,
              } as ModuleKindWithVariant);
              if (!route) return undefined;
              return prefetchRoute(environment, route);
            }),
      ),
    ].filter(disposable => disposable !== undefined);
    return () => {
      disposables?.forEach(disposable => disposable.dispose());
    };
  }, [prefetchRoute, environment]);
  // #endregion

  // #region New Module
  const [showContentModal, openContentModal, closeContentModal] =
    useBoolean(false);

  const onRequestNewModule = useCallback(() => {
    Toast.hide();
    openContentModal();
  }, [openContentModal]);
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

  const onEditCover = useCallback(() => {
    //TODO: find a better way but with our router, the Toast is keep to(not an autohide toast)
    Toast.hide();
    router.push({
      route: 'COVER_EDITION',
    });
  }, [router]);
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
  useEffect(() => {
    if (!webCard?.cardIsPublished && webCard?.cardModules?.length) {
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
    }

    return () => {
      Toast.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    <Container style={{ flex: 1 }}>
      <Suspense>
        <WebCardEditScreenHeader
          webCard={webCard}
          selectionMode={false}
          nbSelectedModules={nbSelectedModules}
          selectionContainsAllModules={selectionContainsAllModules}
          onDone={onDone}
          onEditModules={onEditModules}
          onCancelEditModules={toggleSelectionMode}
          onSelectAllModules={onSelectAllModules}
          onUnSelectAllModules={onUnSelectAllModules}
          disabledButtons={showWebCardColorPicker}
        />
      </Suspense>
      <WebCardEditScreenScrollView
        ref={scrollViewRef}
        editFooter={
          <Suspense>
            <WebCardScreenEditModeFooter
              fromCreation={!!fromCreation}
              onAddContent={openContentModal}
              onSkip={onDone}
              webCard={webCard}
            />
          </Suspense>
        }
        editFooterHeight={WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT}
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
            canPlay
            large
            useAnimationSnapshot
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
      <Suspense fallback={null}>
        <WebCardEditScreenFooter
          selectionMode={selectionMode}
          selectionModeTransition={selectionModeTransition}
          hasSelectedModules={nbSelectedModules > 0}
          selectionContainsHiddenModules={selectionContainsHiddenModules}
          webCard={webCard}
          onRequestNewModule={onRequestNewModule}
          onRequestColorPicker={openWebCardColorPicker}
          onRequestWebCardStyle={openCardStyleModal}
          onRequestPreview={openPreviewModal}
          onDelete={onDeleteSelectedModules}
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
        <AddModuleSectionModal
          webCard={webCard}
          close={closeContentModal}
          open={showContentModal}
        />
      </Suspense>
    </Container>
  );
};
export default relayScreen(WebCardEditScreen, {
  query,
  getVariables: ({ webCardId }) => ({
    webCardId,
  }),
  getScreenOptions: () => ({
    stackAnimation: 'fade',
    transitionDuration: 220,
  }),
});
