import { IntlErrorCode } from '@formatjs/intl';
import * as Sentry from '@sentry/react-native';
import { fromGlobalId } from 'graphql-relay';
import {
  Component,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, IntlProvider, injectIntl } from 'react-intl';
import { BackHandler, useColorScheme } from 'react-native';
import { hide as hideSplashScreen } from 'react-native-bootsplash';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { RelayEnvironmentProvider } from 'react-relay';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { mainRoutes, signInRoutes, signUpRoutes } from '#mobileRoutes';
import { colors } from '#theme';
import MainTabBar from '#components/MainTabBar';
import {
  useNativeRouter,
  ScreensRenderer,
  RouterProvider,
} from '#components/NativeRouter';
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
  ROOT_ACTOR_ID,
  addEnvironmentListener,
  getRelayEnvironment,
} from '#helpers/relayEnvironment';
import * as RelayQueryManager from '#helpers/RelayQueryManager';
import { isRelayScreen } from '#helpers/relayScreen';
import {
  ScreenPrefetcherProvider,
  createScreenPrefetcher,
} from '#helpers/ScreenPrefetcher';
import useApplicationFonts from '#hooks/useApplicationFonts';
import useAuthState from '#hooks/useAuthState';
import { useDeepLink } from '#hooks/useDeepLink';
import AccountDetailsScreen from '#screens/AccountDetailsScreen';
import CardModuleEditionScreen from '#screens/CardModuleEditionScreen';
import ContactCardScreen from '#screens/ContactCardScreen';
import CoverEditionScreen from '#screens/CoverEditionScreen';
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
import NewProfileScreen from '#screens/NewProfileScreen';
import PostCommentsMobileScreen from '#screens/PostCommentsScreen';
import PostCreationScreen from '#screens/PostCreationScreen';
import PostScreen from '#screens/PostScreen';
import ProfileScreen from '#screens/ProfileScreen';
import ResetPasswordScreen from '#screens/ResetPasswordScreen';
import SearchScreen from '#screens/SearchScreen';
import SignInScreen from '#screens/SignInScreen';
import SignupScreen from '#screens/SignUpScreen';
import UpdateApplicationScreen from '#screens/UpdateApplicationScreen';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Text from '#ui/Text';
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
    }),
  ],
});

/**
 * Initialize the application
 * called at first launch before rendering the App component
 */
const init = async () => {
  await initAuthStore();
  initLocaleHelpers();
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
    <AppIntlProvider>
      <ErrorBoundary>
        <PermissionProvider>
          <KeyboardProvider>
            <AppRouter />
          </KeyboardProvider>
        </PermissionProvider>
      </ErrorBoundary>
    </AppIntlProvider>
  );
};

export default Sentry.wrap(App);

// #region Routing Definitions
const screens = {
  SIGN_IN: SignInScreen,
  SIGN_UP: SignupScreen,
  FORGOT_PASSWORD: ForgotPasswordScreen,
  FORGOT_PASSWORD_CONFIRMATION: ForgotPasswordConfirmationScreen,
  RESET_PASSWORD: ResetPasswordScreen,
  HOME: HomeScreen,
  MEDIA: MediaScreen,
  SEARCH: SearchScreen,
  POST: PostScreen,
  POST_COMMENTS: PostCommentsMobileScreen,
  NEW_POST: PostCreationScreen,
  NEW_PROFILE: NewProfileScreen,
  CARD_MODULE_EDITION: CardModuleEditionScreen,
  COVER_EDITION: CoverEditionScreen,
  PROFILE: ProfileScreen,
  FOLLOWINGS: FollowingsScreen,
  FOLLOWINGS_MOSAIC: FollowingsMosaicScreen,
  FOLLOWERS: FollowersScreen,
  ACCOUNT_DETAILS: AccountDetailsScreen,
  INVITE_FRIENDS: InviteFriendsScreen,
  CONTACT_CARD: ContactCardScreen,
  ONBOARDING: WelcomeScreen,
  LIKED_POSTS: LikedPostsScreen,
};

const tabs = {
  MAIN_TAB: MainTabBar,
};

// #endregion

const unauthenticatedRoutes = ['SIGN_IN', 'SIGN_UP', 'FORGOT_PASSWORD'];

/**
 * The main application component
 */
const AppRouter = () => {
  // #region Routing
  const initialRoutes = useMemo(() => {
    const { authenticated, hasBeenSignedIn, profileId } = getAuthState();
    return authenticated
      ? mainRoutes(!profileId)
      : hasBeenSignedIn
      ? signInRoutes
      : signUpRoutes;
  }, []);

  const { router, routerState } = useNativeRouter(initialRoutes);
  const { authenticated, profileId } = useAuthState();

  useEffect(() => {
    const currentRoute = router.getCurrentRoute()?.route;
    if (currentRoute) {
      if (!authenticated && !unauthenticatedRoutes.includes(currentRoute)) {
        router.replaceAll(signInRoutes);
      } else if (
        authenticated &&
        unauthenticatedRoutes.includes(currentRoute)
      ) {
        router.replaceAll(mainRoutes(!profileId));
      }
    }
  }, [authenticated, profileId, router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (router.canGoBack()) {
          router.back();
          return true;
        }

        return false;
      },
    );

    return () => subscription.remove();
  }, [router]);
  // #endregion

  // #region Sentry Routing Instrumentation
  useEffect(() => {
    Sentry.setUser(profileId ? { id: fromGlobalId(profileId).id } : null);
  }, [profileId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const environmentReseted = useRef(false);
  const [environment, setEnvironment] = useState(getRelayEnvironment());
  useEffect(
    () =>
      addEnvironmentListener(event => {
        if (event === 'reset') {
          environmentReseted.current = true;
        }
      }),
    [],
  );

  const getEnvironmentForActor = useCallback(
    (actorId: string) => {
      return environment.forActor(actorId);
    },
    [environment],
  );

  const screenIdToDispose = useRef<string[]>([]).current;

  const screenPrefetcher = useMemo(
    () =>
      createScreenPrefetcher(
        screens as Record<ROUTES, ScreenPrefetchOptions<any>>,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    router.addScreenWillBePushedListener(({ id, route }) => {
      const Component = screens[route.route];
      if (isRelayScreen(Component)) {
        RelayQueryManager.loadQueryFor(id, Component, route.params);
      }
    });
    router.addScreenWillBeRemovedListener(({ id }) => {
      screenIdToDispose.push(id);
    });
  }, [router, screenIdToDispose, screenPrefetcher]);

  useDeepLink(router);

  const onScreenDismissed = useCallback(
    (id: string) => {
      router.screenDismissed(id);

      // TODO should we not handle this in the router?
      RelayQueryManager.disposeQueryFor(id);
    },
    [router],
  );

  const slapshScreenHidden = useRef(false);
  const onFinishTransitioning = useCallback(() => {
    // We reset the environment only here
    // To avoid resetting it when old screens are still visible
    if (environmentReseted.current) {
      setEnvironment(getRelayEnvironment());
      environmentReseted.current = false;
    }
    screenIdToDispose.forEach(screen =>
      RelayQueryManager.disposeQueryFor(screen),
    );
    screenIdToDispose.length = 0;
    if (!slapshScreenHidden.current) {
      setTimeout(() => {
        hideSplashScreen({ fade: true });
      }, 200);
    }
  }, [screenIdToDispose]);
  // #endregion

  // #region Loading Screen
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

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
    <RelayEnvironmentProvider
      environment={environment.forActor(ROOT_ACTOR_ID)}
      // @ts-expect-error not in the types
      getEnvironmentForActor={getEnvironmentForActor}
    >
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
              onScreenDismissed={onScreenDismissed}
              onFinishTransitioning={onFinishTransitioning}
            />
          </RouterProvider>
          <Toast />
          <LoadingScreen visible={showLoadingScreen} />
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
    if (!__DEV__) {
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
