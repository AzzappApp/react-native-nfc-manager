import { IntlErrorCode } from '@formatjs/intl';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { IntlProvider } from 'react-intl';
import { View } from 'react-native';
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
import useAuthState from '#hooks/userAuthState';
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
import SettingsMobileScreen from './mobileScreens/SettingsMobileScreen';
import SignInMobileScreen from './mobileScreens/SignInMobileScreen';
import SignUpMobileScreen from './mobileScreens/SignUpMobileScreen';
import { PlatformEnvironmentProvider } from './PlatformEnvironment';

// #region Routing Definitions
const screens = {
  SIGN_IN: SignInMobileScreen,
  SIGN_UP: SignUpMobileScreen,
  FORGOT_PASSWORD: ForgotPasswordMobileScreen,
  CHANGE_PASSWORD: ChangePasswordMobileScreen,
  HOME: HomeMobileScreen,
  SEARCH: SearchMobileScreen,
  SETTINGS: SettingsMobileScreen,
  CHAT: () => <View />,
  POST: PostMobileScreen,
  PROFILE_POSTS: ProfilePostsMobileScreen,
  NEW_POST: PostCreationMobileScreen,
  NEW_PROFILE: NewProfileMobileScreen,
  CARD_MODULE_EDITION: CardModuleEditionMobileScreen,
  PROFILE: ProfileMobileScreen,
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

  // #region Relay Query Management
  const screenIdToDispose = useRef<string[]>([]).current;

  useEffect(() => {
    router.addScreenWillBePushedListener(({ id, route: { route, params } }) => {
      const Component = screens[route];
      if (isRelayScreen(Component)) {
        RelayQueryManager.loadQueryFor(id, Component, params);
      }
    });
    router.addScreenWillBeRemovedListener(({ id }) => {
      screenIdToDispose.push(id);
    });
  }, [router, screenIdToDispose]);

  const onScreenDismissed = useCallback(
    (id: string) => {
      router.screenDismissed(id);
    },
    [router],
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

  return (
    <RelayEnvironmentProvider environment={getRelayEnvironment()}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
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
    </RelayEnvironmentProvider>
  );
};

export default waitFor(App, init());

const unauthenticatedRoutes = ['SIGN_IN', 'SIGN_UP', 'FORGOT_PASSWORD'];
