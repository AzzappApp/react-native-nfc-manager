import { IntlErrorCode } from '@formatjs/intl';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { IntlProvider } from 'react-intl';
import { View, useColorScheme } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { RelayEnvironmentProvider } from 'react-relay';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import {
  mainRoutes,
  newProfileRoute,
  signInRoutes,
  signUpRoutes,
} from '#mobileRoutes';
import { colors } from '#theme';
import MainTabBar from '#components/MainTabBar';
import {
  useNativeRouter,
  ScreensRenderer,
  RouterProvider,
} from '#components/NativeRouter';
import Toast from '#components/Toast';
import { getAuthState, init as initAuthStore } from '#helpers/authStore';
import {
  init as initLocaleHelpers,
  messages,
  useCurrentLocale,
} from '#helpers/localeHelpers';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import * as RelayQueryManager from '#helpers/RelayQueryManager';
import { isRelayScreen } from '#helpers/relayScreen';
import {
  ScreenPrefetcherProvider,
  createScreenPrefetcher,
} from '#helpers/ScreenPrefetcher';
import waitFor from '#helpers/waitFor';
import useAuthState from '#hooks/useAuthState';
import { useDeepLink } from '#hooks/useDeepLink';
import AccountDetailsScreen from '#screens/AccountDetailsScreen';
import AccountScreen from '#screens/AccountScreen';
import CardModuleEditionMobileScreen from '#screens/CardModuleEditionMobileScreen';
import ChangePasswordScreen from '#screens/ChangePasswordScreen';
import ContactCardScreen from '#screens/ContactCardScreen';
import FollowersScreen from '#screens/FollowersScreen';
import FollowingsScreen from '#screens/FollowingsScreen';
import ForgotPasswordScreen from '#screens/ForgotPasswordScreen';
import HomeScreen from '#screens/HomeScreen';
import InviteFriendsScreen from '#screens/InviteFriendsScreen';
import NewProfileScreen from '#screens/NewProfileScreen';
import PostCommentsMobileScreen from '#screens/PostCommentsScreen';
import PostCreationScreen from '#screens/PostCreationScreen';
import PostScreen from '#screens/PostScreen';
import ProfileScreen from '#screens/ProfileScreen';
import SearchScreen from '#screens/SearchScreen';
import SignInScreen from '#screens/SignInScreen';
import SignupScreen from '#screens/SignUpScreen';
import type { ScreenPrefetchOptions } from '#helpers/ScreenPrefetcher';
import type { ROUTES } from '#routes';

// #region Routing Definitions
const screens = {
  SIGN_IN: SignInScreen,
  SIGN_UP: SignupScreen,
  FORGOT_PASSWORD: ForgotPasswordScreen,
  CHANGE_PASSWORD: ChangePasswordScreen,
  HOME: HomeScreen,
  SEARCH: SearchScreen,
  ACCOUNT: AccountScreen,
  ALBUMS: () => <View />,
  CHAT: () => <View />,
  POST: PostScreen,
  POST_COMMENTS: PostCommentsMobileScreen,
  NEW_POST: PostCreationScreen,
  NEW_PROFILE: NewProfileScreen,
  CARD_MODULE_EDITION: CardModuleEditionMobileScreen,
  PROFILE: ProfileScreen,
  FOLLOWINGS: FollowingsScreen,
  FOLLOWERS: FollowersScreen,
  ACCOUNT_DETAILS: AccountDetailsScreen,
  INVITE_FRIENDS: InviteFriendsScreen,
  CONTACT_CARD: ContactCardScreen,
};

const tabs = {
  MAIN_TAB: MainTabBar,
};

// #endregion

/**
 * Initialize the application
 * called at first launch before rendering the App component
 * @see waitFor
 */
const init = async () => {
  await initAuthStore();
  initLocaleHelpers();
  RelayQueryManager.init();
};

/**
 * The main application component
 */
const App = () => {
  // #region Routing
  const initialRoutes = useMemo(() => {
    const { authenticated, profileId, hasBeenSignedIn } = getAuthState();
    if (!authenticated) {
      return hasBeenSignedIn ? signInRoutes : signUpRoutes;
    }
    if (!profileId) {
      return newProfileRoute;
    }
    return mainRoutes;
  }, []);

  const { router, routerState } = useNativeRouter(initialRoutes);
  const { authenticated } = useAuthState();

  useEffect(() => {
    if (
      !authenticated &&
      !unauthenticatedRoutes.includes(router.getCurrentRoute().route)
    ) {
      router.replaceAll(signInRoutes);
    }
  }, [authenticated, router]);

  // #endregion

  // #region Relay Query Management and Screen Prefetching
  const screenIdToDispose = useRef<string[]>([]).current;

  const screenPrefetcher = useMemo(
    () =>
      createScreenPrefetcher(screens as Record<ROUTES, ScreenPrefetchOptions>),
    [],
  );

  useEffect(() => {
    router.addScreenWillBePushedListener(({ id, route }) => {
      const Component = screens[route.route];
      if (isRelayScreen(Component)) {
        RelayQueryManager.loadQueryFor(id, Component, route.params);
      }
      screenPrefetcher.screenWillBePushed(id, route);
    });
    router.addScreenWillBeRemovedListener(({ id }) => {
      screenIdToDispose.push(id);
      screenPrefetcher.screenWillBeRemoved(id);
    });
  }, [router, screenIdToDispose, screenPrefetcher]);

  useDeepLink(router);

  const onScreenDismissed = useCallback(
    (id: string) => {
      router.screenDismissed(id);

      // TODO should we not handle this in the router?
      screenIdToDispose.push(id);
      screenPrefetcher.screenWillBeRemoved(id);
    },
    [router, screenIdToDispose, screenPrefetcher],
  );

  const onFinishTransitioning = useCallback(() => {
    screenIdToDispose.forEach(screen =>
      RelayQueryManager.disposeQueryFor(screen),
    );
    screenIdToDispose.length = 0;
  }, [screenIdToDispose]);
  // #endregion

  // #region Internationalization
  const locale = useCurrentLocale();

  const onIntlError = (err: any) => {
    if (__DEV__ && err.code === IntlErrorCode.MISSING_TRANSLATION) {
      return;
    }
    console.error(err);
  };

  const langMessages = useMemo(() => {
    let langMessages = messages[DEFAULT_LOCALE];
    if (locale !== DEFAULT_LOCALE) {
      langMessages = Object.assign({}, langMessages, messages[locale]);
    }
    return langMessages;
  }, [locale]);

  // #endregion

  const colorScheme = useColorScheme();

  const safeAreaBackgroundStyle = useMemo(() => {
    return {
      backgroundColor: colorScheme === 'light' ? colors.white : colors.black,
    };
  }, [colorScheme]);

  return (
    <RelayEnvironmentProvider environment={getRelayEnvironment()}>
      <ScreenPrefetcherProvider value={screenPrefetcher}>
        <SafeAreaProvider
          initialMetrics={initialWindowMetrics}
          style={safeAreaBackgroundStyle}
        >
          <IntlProvider
            locale={locale}
            defaultLocale={DEFAULT_LOCALE}
            messages={langMessages}
            onError={onIntlError}
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
          </IntlProvider>
        </SafeAreaProvider>
      </ScreenPrefetcherProvider>
    </RelayEnvironmentProvider>
  );
};

export default waitFor(App, init());

const unauthenticatedRoutes = ['SIGN_IN', 'SIGN_UP', 'FORGOT_PASSWORD'];
