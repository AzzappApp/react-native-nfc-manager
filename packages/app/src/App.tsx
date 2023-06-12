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
import {
  ScreenPrefetcherProvider,
  createScreenPrefetcher,
} from '#helpers/ScreenPrefetcher';
import useAuthState from '#hooks/useAuthState';
import AccountDetailsMobileScreen from '#mobileScreens/AccountDetailsMobileScreen';
import ContactCardMobileScreen from '#mobileScreens/ContactCardMobileScreen';
import FollowedProfilesMobileScreen from '#mobileScreens/FollowedProfilesMobileScreen';
import FollowersMobileScreen from '#mobileScreens/FollowersMobileScreen';
import InviteFriendsMobileScreen from '#mobileScreens/InviteFriendsMobileScreen';
import PostCommentsMobileScreen from '#mobileScreens/PostCommentsMobileScreen';
import MainTabBar from './components/MainTabBar';
import { useNativeRouter, ScreensRenderer } from './components/NativeRouter';
import { getAuthState, init as initAuthStore } from './helpers/authStore';
import createPlatformEnvironment from './helpers/createPlatformEnvironment';
import {
  init as initLocaleHelpers,
  messages,
  useCurrentLocale,
} from './helpers/localeHelpers';
import { getRelayEnvironment } from './helpers/relayEnvironment';
import * as RelayQueryManager from './helpers/RelayQueryManager';
import { isRelayScreen } from './helpers/relayScreen';
import waitFor from './helpers/waitFor';
import AccountMobileScreen from './mobileScreens/AccountMobileScreen';
import CardModuleEditionMobileScreen from './mobileScreens/CardModuleEditionMobileScreen';
import ChangePasswordMobileScreen from './mobileScreens/ChangePasswordMobileScreen';
import ForgotPasswordMobileScreen from './mobileScreens/ForgotPasswordMobileScreen';
import HomeMobileScreen from './mobileScreens/HomeMobileScreen';
import NewProfileMobileScreen from './mobileScreens/NewProfileMobileScreen';
import PostCreationMobileScreen from './mobileScreens/PostCreationMobileScreen';
import PostMobileScreen from './mobileScreens/PostMobileScreen';
import ProfileMobileScreen from './mobileScreens/ProfileMobileScreen';
import ProfilePostsMobileScreen from './mobileScreens/ProfilePostsMobileScreen';
import SearchMobileScreen from './mobileScreens/SearchMobileScreen';
import SignInMobileScreen from './mobileScreens/SignInMobileScreen';
import SignUpMobileScreen from './mobileScreens/SignUpMobileScreen';
import { PlatformEnvironmentProvider } from './PlatformEnvironment';
import type { ScreenPrefetchOptions } from '#helpers/ScreenPrefetcher';
import type { ROUTES } from '#routes';

// #region Routing Definitions
const screens = {
  SIGN_IN: SignInMobileScreen,
  SIGN_UP: SignUpMobileScreen,
  FORGOT_PASSWORD: ForgotPasswordMobileScreen,
  CHANGE_PASSWORD: ChangePasswordMobileScreen,
  HOME: HomeMobileScreen,
  SEARCH: SearchMobileScreen,
  ACCOUNT: AccountMobileScreen,
  ALBUMS: () => <View />,
  CHAT: () => <View />,
  POST: PostMobileScreen,
  POST_COMMENTS: PostCommentsMobileScreen,
  PROFILE_POSTS: ProfilePostsMobileScreen,
  NEW_POST: PostCreationMobileScreen,
  NEW_PROFILE: NewProfileMobileScreen,
  CARD_MODULE_EDITION: CardModuleEditionMobileScreen,
  PROFILE: ProfileMobileScreen,
  FOLLOWED_PROFILES: FollowedProfilesMobileScreen,
  FOLLOWERS: FollowersMobileScreen,
  ACCOUNT_DETAILS: AccountDetailsMobileScreen,
  INVITE_FRIENDS: InviteFriendsMobileScreen,
  CONTACT_CARD: ContactCardMobileScreen,
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

  const platformEnvironment = useMemo(() => {
    return createPlatformEnvironment(router);
  }, [router]);

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
            <PlatformEnvironmentProvider value={platformEnvironment}>
              <ScreensRenderer
                routerState={routerState}
                screens={screens}
                tabs={tabs}
                onScreenDismissed={onScreenDismissed}
                onFinishTransitioning={onFinishTransitioning}
              />
            </PlatformEnvironmentProvider>
          </IntlProvider>
        </SafeAreaProvider>
      </ScreenPrefetcherProvider>
    </RelayEnvironmentProvider>
  );
};

export default waitFor(App, init());

const unauthenticatedRoutes = ['SIGN_IN', 'SIGN_UP', 'FORGOT_PASSWORD'];
