import { IntlErrorCode } from '@formatjs/intl';
import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Component,
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, IntlProvider, injectIntl } from 'react-intl';
import { Platform, useColorScheme } from 'react-native';
import { hide as hideSplashScreen } from 'react-native-bootsplash';
import { KeyboardProvider } from 'react-native-keyboard-controller';
// import Purchases from 'react-native-purchases';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { RelayEnvironmentProvider } from 'react-relay';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { isNetworkError } from '@azzapp/shared/networkHelpers';
import { mainRoutes, signInRoutes, signUpRoutes } from '#mobileRoutes';
import { colors } from '#theme';
import MainTabBar from '#components/MainTabBar';
import {
  useNativeRouter,
  ScreensRenderer,
  RouterProvider,
} from '#components/NativeRouter';
//import ShakeShare from '#components/ShakeShare';
import ShakeShare from '#components/ShakeShare';
import Toast from '#components/Toast';
import { getAuthState, init as initAuthStore } from '#helpers/authStore';
import { addGlobalEventListener } from '#helpers/globalEvents';
import {
  init as initLocaleHelpers,
  messages,
  useCurrentLocale,
} from '#helpers/localeHelpers';
import { PermissionProvider } from '#helpers/PermissionContext';
import {
  addEnvironmentListener,
  getRelayEnvironment,
} from '#helpers/relayEnvironment';
import * as RelayQueryManager from '#helpers/RelayQueryManager';
import { isRelayScreen } from '#helpers/relayScreen';
import {
  ScreenPrefetcherProvider,
  createScreenPrefetcher,
} from '#helpers/ScreenPrefetcher';
import useApplicationFonts, {
  loadSkiaTypeFonts,
} from '#hooks/useApplicationFonts';
import useAuthState from '#hooks/useAuthState';
import { useDeepLink } from '#hooks/useDeepLink';
import AboutScreen from '#screens/AboutScreen';
import AccountDetailsScreen from '#screens/AccountDetailsScreen';
import CardModuleEditionScreen from '#screens/CardModuleEditionScreen';
import CommonInformationScreen from '#screens/CommonInformationScreen';
import ConfirmChangeContactScreen from '#screens/ConfirmChangeContactScreen';
import ConfirmRegistrationScreen from '#screens/ConfirmRegistrationScreen';
import ContactCardEditScreen from '#screens/ContactCardEditScreen';
import ContactCardScreen from '#screens/ContactCardScreen';
import CoverCreationScreen from '#screens/CoverCreationScreen';
import CoverEditionScreen from '#screens/CoverEditionScreen';
import CoverTemplateSelectionScreen from '#screens/CoverTemplateSelectionScreen';
import EmailSignatureScreen from '#screens/EmailSignatureScreen';
import FollowersScreen from '#screens/FollowersScreen';
import FollowingsMosaicScreen from '#screens/FollowingsMosaicScreen';
import FollowingsScreen from '#screens/FollowingsScreen';
import ForgotPasswordConfirmationScreen from '#screens/ForgotPasswordConfirmationScreen';
import ForgotPasswordScreen from '#screens/ForgotPasswordScreen';
import HomeScreen from '#screens/HomeScreen';
import WelcomeScreen from '#screens/HomeScreen/WelcomeScreen';
import InviteFriendsScreen from '#screens/InviteFriendsScreen';
import LikedPostsScreen from '#screens/LikedPostsScreen';
import LoadingScreen from '#screens/LoadingScreen';
import MediaScreen from '#screens/MediaScreen';
import MultiUserAddScreen from '#screens/MultiUserAddScreen';
import MultiUserDetailsScreen from '#screens/MultiUserDetailsScreen';
import MultiUserScreen from '#screens/MultiUserScreen';
import PostCommentsMobileScreen from '#screens/PostCommentsScreen';
import PostCreationScreen from '#screens/PostCreationScreen';
import PostLikesScreen from '#screens/PostLikesScreen/PostLikesScreen';
import PostScreen from '#screens/PostScreen';
import ResetPasswordScreen from '#screens/ResetPasswordScreen';
import SearchScreen from '#screens/SearchScreen';
import SignInScreen from '#screens/SignInScreen';
import SignupScreen from '#screens/SignUpScreen';
import UpdateApplicationScreen from '#screens/UpdateApplicationScreen';
import UserPayWallScreen from '#screens/UserPayWallScreen';
import WebCardFormScreen from '#screens/WebCardFormScreen';
import WebCardKindSelectionScreen from '#screens/WebCardKindSelectionScreen';
import WebCardParametersScreen from '#screens/WebCardParametersScreen';
import WebCardScreen from '#screens/WebCardScreen';
import WebCardTemplateSelectionScreen from '#screens/WebCardTemplateSelectionScreen';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Text from '#ui/Text';
import type { ScreenMap } from '#components/NativeRouter';
import type { ScreenPrefetchOptions } from '#helpers/ScreenPrefetcher';
import type { ROUTES } from '#routes';
import type { ReactNode } from 'react';
import type { IntlShape } from 'react-intl';

const routingInstrumentation = new Sentry.RoutingInstrumentation();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !__DEV__,
  environment: process.env.DEPLOYMENT_ENVIRONMENT,
  // TODO better configuration based on environment
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
      // WARNING: This option interferes with reanimated and creates flickering in some animations
      // do not enable it unless it has been fixed
      enableStallTracking: false,
    }),
  ],
});

//initializing RC sneed to be done early
// if (Platform.OS === 'ios') {
//   Purchases.configure({
//     apiKey: process.env.PURCHASE_IOS_KEY!,
//   });
// } else if (Platform.OS === 'android') {
//   Purchases.configure({
//     apiKey: process.env.PURCHASE_ANDROID_KEY!,
//   });
// }

/**
 * Initialize the application
 * called at first launch before rendering the App component
 */
const init = async () => {
  await initAuthStore();
  initLocaleHelpers();
  loadSkiaTypeFonts();
  RelayQueryManager.init();
};

const initPromise = init();

const App = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initPromise.finally(() => {
      setReady(true);
    });
  }, []);

  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(
    () =>
      addGlobalEventListener('NETWORK_ERROR', ({ payload }) => {
        const { error } = payload;
        if (
          error instanceof Error &&
          error.message === ERRORS.UPDATE_APP_VERSION
        ) {
          setNeedsUpdate(true);
        }
      }),
    [],
  );
  if (!ready) {
    return null;
  }

  const ErrorBoundary = __DEV__ ? Fragment : AppErrorBoundary;

  if (needsUpdate) {
    return (
      <AppIntlProvider>
        <UpdateApplicationScreen />
      </AppIntlProvider>
    );
  }

  return (
    <>
      {Platform.OS === 'android' && <StatusBar style="auto" translucent />}
      <AppIntlProvider>
        <ErrorBoundary>
          <PermissionProvider>
            <KeyboardProvider statusBarTranslucent>
              <AppRouter />
            </KeyboardProvider>
          </PermissionProvider>
        </ErrorBoundary>
      </AppIntlProvider>
    </>
  );
};

export default Sentry.wrap(App);

// #region Routing Definitions
const screens = {
  ABOUT: AboutScreen,
  ACCOUNT_DETAILS: AccountDetailsScreen,
  CARD_MODULE_EDITION: CardModuleEditionScreen,
  CONTACT_CARD: ContactCardScreen,
  CONTACT_CARD_EDIT: ContactCardEditScreen,
  CONFIRM_CHANGE_CONTACT: ConfirmChangeContactScreen,
  COMMON_INFORMATION: CommonInformationScreen,
  COVER_CREATION: CoverCreationScreen,
  COVER_EDITION: CoverEditionScreen,
  COVER_TEMPLATE_SELECTION: CoverTemplateSelectionScreen,
  EMAIL_SIGNATURE: EmailSignatureScreen,
  FOLLOWINGS: FollowingsScreen,
  FOLLOWINGS_MOSAIC: FollowingsMosaicScreen,
  FOLLOWERS: FollowersScreen,
  FORGOT_PASSWORD: ForgotPasswordScreen,
  FORGOT_PASSWORD_CONFIRMATION: ForgotPasswordConfirmationScreen,
  HOME: HomeScreen,
  INVITE_FRIENDS: InviteFriendsScreen,
  LIKED_POSTS: LikedPostsScreen,
  MULTI_USER: MultiUserScreen,
  MULTI_USER_ADD: MultiUserAddScreen,
  MULTI_USER_DETAIL: MultiUserDetailsScreen,
  MEDIA: MediaScreen,
  NEW_POST: PostCreationScreen,
  ONBOARDING: WelcomeScreen,
  POST: PostScreen,
  POST_COMMENTS: PostCommentsMobileScreen,
  POST_LIKES: PostLikesScreen,
  RESET_PASSWORD: ResetPasswordScreen,
  SIGN_IN: SignInScreen,
  SIGN_UP: SignupScreen,
  CONFIRM_REGISTRATION: ConfirmRegistrationScreen,
  SEARCH: SearchScreen,
  USER_PAY_WALL: UserPayWallScreen,
  WEBCARD: WebCardScreen,
  WEBCARD_PARAMETERS: WebCardParametersScreen,
  WEBCARD_KIND_SELECTION: WebCardKindSelectionScreen,
  WEBCARD_FORM: WebCardFormScreen,
  WEBCARD_TEMPLATE_SELECTION: WebCardTemplateSelectionScreen,
} satisfies ScreenMap;

const tabs = {
  MAIN_TAB: MainTabBar,
};

// #endregion

const unauthenticatedRoutes = [
  'SIGN_IN',
  'SIGN_UP',
  'FORGOT_PASSWORD',
  'CONFIRM_REGISTRATION',
];

/**
 * The main application component
 */
const AppRouter = () => {
  // #region Routing
  const initialRoutes = useMemo(() => {
    const { authenticated, hasBeenSignedIn } = getAuthState();
    return authenticated
      ? mainRoutes(false)
      : hasBeenSignedIn
        ? signInRoutes
        : signUpRoutes;
  }, []);

  const { router, routerState } = useNativeRouter(initialRoutes);
  const { authenticated, profileInfos } = useAuthState();

  useEffect(() => {
    const currentRoute = router.getCurrentRoute()?.route;
    if (currentRoute) {
      if (!authenticated && !unauthenticatedRoutes.includes(currentRoute)) {
        router.replaceAll(signInRoutes);
      } else if (
        authenticated &&
        unauthenticatedRoutes.includes(currentRoute)
      ) {
        router.replaceAll(mainRoutes(false));
      }
    }
  }, [authenticated, profileInfos, router]);
  // #endregion

  // #region Sentry Routing Instrumentation
  useEffect(() => {
    Sentry.setUser({
      id: profileInfos?.userId,
      username: profileInfos?.email ?? profileInfos?.phoneNumber ?? undefined,
      email: profileInfos?.email ?? undefined,
      phoneNumber: profileInfos?.phoneNumber,
    });
    Sentry.setTags({
      profileId: profileInfos?.profileId,
      webCardId: profileInfos?.webCardId,
      profileRole: profileInfos?.profileRole,
    });
  }, [profileInfos]);

  useEffect(() => {
    const previous = router.getCurrentRoute();
    const disposable = router.addRouteWillChangeListener(route => {
      routingInstrumentation.onRouteWillChange({
        name: route.route,
        op: 'navigation',
        data: {
          route: {
            name: route.route,
            params: route.params,
          },
          previousRoute: previous
            ? {
                name: previous.route,
                params: previous.params,
              }
            : null,
        },
      });
    });
    return () => {
      disposable.dispose();
    };
  }, [router]);
  // #endregion

  // #region Relay Query Management and Screen Prefetching
  const environmentReset = useRef(false);
  const [environment, setEnvironment] = useState(getRelayEnvironment());
  useEffect(
    () =>
      addEnvironmentListener(event => {
        if (event === 'reset') {
          environmentReset.current = true;
        }
      }),
    [],
  );

  const screenIdsToDispose = useRef<string[]>([]).current;

  const screenPrefetcher = useMemo(
    () =>
      createScreenPrefetcher(
        screens as Record<ROUTES, ScreenPrefetchOptions<any>>,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const disposeScreens = useCallback(() => {
    screenIdsToDispose.forEach(screen =>
      RelayQueryManager.disposeQueryFor(screen),
    );
    screenIdsToDispose.length = 0;
  }, [screenIdsToDispose]);

  useEffect(() => {
    const screenWillBePushedSubscription = router.addScreenWillBePushedListener(
      pushedScreens => {
        pushedScreens.forEach(({ id, route }) => {
          const Component = screens[route.route];
          if (isRelayScreen(Component)) {
            RelayQueryManager.loadQueryFor(id, Component, route.params);
          }
        });
      },
    );
    const screenWillBeRemoveddSubscription =
      router.addScreenWillBeRemovedListener(removedScreens => {
        screenIdsToDispose.push(...removedScreens.map(screen => screen.id));
      });
    return () => {
      screenWillBePushedSubscription.dispose();
      screenWillBeRemoveddSubscription.dispose();
    };
  }, [disposeScreens, router, screenIdsToDispose, screenPrefetcher]);

  const splashScreenHidden = useRef(false);
  const onFinishTransitioning = useCallback(() => {
    // We reset the environment only here
    // To avoid resetting it when old screens are still visible
    if (environmentReset.current) {
      setEnvironment(getRelayEnvironment());
      environmentReset.current = false;
    }
    disposeScreens();
    if (!splashScreenHidden.current) {
      setTimeout(() => {
        hideSplashScreen({ fade: true });
      }, 200);
    }
  }, [disposeScreens]);
  // #endregion

  // #region Loading Screen
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  useEffect(
    () =>
      addGlobalEventListener('READY', () => {
        setShowLoadingScreen(false);
      }),
    [],
  );

  useEffect(() => {
    if (!authenticated) {
      setTimeout(() => {
        setShowLoadingScreen(false);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // #endregion

  useDeepLink(router);

  const colorScheme = useColorScheme();

  const safeAreaBackgroundStyle = useMemo(() => {
    return {
      backgroundColor: colorScheme === 'light' ? colors.white : colors.black,
    };
  }, [colorScheme]);

  // TODO handle errors
  const [fontLoaded] = useApplicationFonts();
  if (!fontLoaded) {
    return null;
  }

  return (
    <RelayEnvironmentProvider environment={environment}>
      <ScreenPrefetcherProvider value={screenPrefetcher}>
        <SafeAreaProvider
          initialMetrics={initialWindowMetrics}
          style={safeAreaBackgroundStyle}
        >
          <RouterProvider value={router}>
            <ScreensRenderer
              routerState={routerState}
              screens={screens}
              tabs={tabs}
              onFinishTransitioning={onFinishTransitioning}
              onScreenHasBeenDismissed={disposeScreens}
            />
          </RouterProvider>
          <Toast />
          <Suspense>
            <ShakeShare />
          </Suspense>
          {showLoadingScreen && <LoadingScreen />}
        </SafeAreaProvider>
      </ScreenPrefetcherProvider>
    </RelayEnvironmentProvider>
  );
};

const AppIntlProvider = ({ children }: { children: ReactNode }) => {
  // #region Internationalization
  const locale = useCurrentLocale();

  const langMessages = useMemo(() => {
    let langMessages = messages[DEFAULT_LOCALE];
    if (locale !== DEFAULT_LOCALE) {
      langMessages = Object.assign({}, langMessages, messages[locale]);
    }
    return langMessages;
  }, [locale]);

  const onIntlError = (err: any) => {
    if (__DEV__ && err.code === IntlErrorCode.MISSING_TRANSLATION) {
      return;
    }
    console.error(err);
  };
  return (
    <IntlProvider
      locale={locale}
      defaultLocale={DEFAULT_LOCALE}
      messages={langMessages}
      onError={onIntlError}
    >
      {children}
    </IntlProvider>
  );
};

class _AppErrorBoundary extends Component<{
  intl: IntlShape;
  children: ReactNode;
}> {
  state = { error: null };

  componentDidCatch(error: Error) {
    if (!__DEV__ && !isNetworkError(error)) {
      Sentry.captureException(error);
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <Container
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <Text variant="large">
            <FormattedMessage
              defaultMessage="Something went wrong"
              description="Top level error message for uncaught exceptions"
            />
          </Text>
          <Button
            label={this.props.intl.formatMessage({
              defaultMessage: 'Retry',
              description: 'Retry button for uncaught exceptions',
            })}
            onPress={this.retry}
          />
        </Container>
      );
    }
    return this.props.children;
  }
}

const AppErrorBoundary = injectIntl(_AppErrorBoundary);
