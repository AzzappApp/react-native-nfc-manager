import { IntlErrorCode } from '@formatjs/intl';
import { useEffect, useMemo, useRef } from 'react';
import { IntlProvider } from 'react-intl';
import { View } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { RelayEnvironmentProvider } from 'react-relay';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import MainTabBar from './components/MainTabBar';
import { useNativeRouter, ScreensRenderer } from './components/NativeRouter';
import createPlatformEnvironment from './helpers/createPlatformEnvironment';
import {
  init as initLocaleHelpers,
  messages,
  useCurrentLocale,
} from './helpers/localeHelpers';
import { getRelayEnvironment } from './helpers/relayEnvironment';
import * as RelayQueryManager from './helpers/RelayQueryManager';
import { isRelayScreen } from './helpers/relayScreen';
import { init as initTokensStore } from './helpers/tokensStore';
import waitFor from './helpers/waitFor';
import useAuth from './hooks/useAuth';
import CardModuleEditionMobileScreen from './mobileScreens/CardModuleEditionMobileScreen';
import ChangePasswordMobileScreen from './mobileScreens/ChangePasswordMobileScreen';
import ForgotPasswordMobileScreen from './mobileScreens/ForgotPasswordMobileScreen';
import HomeMobileScreen from './mobileScreens/HomeMobileScreen';
import OnBoardingMobileScreen from './mobileScreens/OnBoardingMobileScreen';
import PostCreationMobileScreen from './mobileScreens/PostCreationMobileScreen';
import PostMobileScreen from './mobileScreens/PostMobileScreen';
import ProfileMobileScreen from './mobileScreens/ProfileMobileScreen';
import ProfilePostsMobileScreen from './mobileScreens/ProfilePostsMobileScreen';
import SearchMobileScreen from './mobileScreens/SearchMobileScreen';
import SettingsMobileScreen from './mobileScreens/SettingsMobileScreen';
import SignInMobileScreen from './mobileScreens/SignInMobileScreen';
import SignUpMobileScreen from './mobileScreens/SignUpMobileScreen';
import { PlatformEnvironmentProvider } from './PlatformEnvironment';

import type { NativeRouterInit, TabsMap } from './components/NativeRouter';

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
  ONBOARDING: OnBoardingMobileScreen,
  CARD_MODULE_EDITION: CardModuleEditionMobileScreen,
  PROFILE: ProfileMobileScreen,
};

const tabs = {
  MAIN_TAB: MainTabBar,
};

const unauthenticatedRoutes: NativeRouterInit = {
  id: 'UNAUTHENTICATED',
  stack: [
    { id: 'SIGN_IN', route: 'SIGN_IN' },
    { id: 'FORGOT_PASSWORD', route: 'FORGOT_PASSWORD' },
    { id: 'SIGN_UP', route: 'SIGN_UP' },
  ],
};

const authenticatedRoutes: NativeRouterInit = {
  id: 'AUTHENTICATED',
  stack: [
    {
      id: 'MAIN_TAB',
      currentIndex: 0,
      tabs: [
        {
          id: 'HOME',
          route: 'HOME',
        },
        {
          id: 'SEARCH',
          route: 'SEARCH',
        },
        {
          id: 'CHAT',
          route: 'CHAT',
        },
        {
          id: 'SETTINGS',
          route: 'SETTINGS',
        },
      ],
    },
  ],
};

export const init = async () => {
  await initTokensStore();
  initLocaleHelpers();
  RelayQueryManager.init();
};

const initialisationPromise = init();

const App = () => {
  //we need to decide which route tu use
  const { authenticated } = useAuth();

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

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <IntlProvider
        locale={locale}
        defaultLocale={DEFAULT_LOCALE}
        messages={langMessages}
        onError={onIntlError}
      >
        {authenticated ? (
          <AppRouter routes={authenticatedRoutes} tabs={tabs} />
        ) : (
          <AppRouter routes={unauthenticatedRoutes} />
        )}
      </IntlProvider>
    </SafeAreaProvider>
  );
};

const AppRouter = ({
  routes,
  tabs = {},
}: {
  routes: NativeRouterInit;
  tabs?: TabsMap;
}) => {
  const { router, routerState } = useNativeRouter(routes);

  const platformEnvironment = useMemo(() => {
    return createPlatformEnvironment(router);
  }, [router]);

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

  const onScreenDismissed = (id: string) => {
    router.screenDismissed(id);
  };

  const onFinishTransitioning = () => {
    screenIdToDispose.forEach(screen =>
      RelayQueryManager.disposeQueryFor(screen),
    );
  };

  return (
    <PlatformEnvironmentProvider value={platformEnvironment}>
      <ScreensRenderer
        routerState={routerState}
        screens={screens}
        tabs={tabs}
        onScreenDismissed={onScreenDismissed}
        onFinishTransitioning={onFinishTransitioning}
      />
    </PlatformEnvironmentProvider>
  );
};

const RelayEnvironnementProvider = () => {
  return (
    <RelayEnvironmentProvider environment={getRelayEnvironment()}>
      <App />
    </RelayEnvironmentProvider>
  );
};

export default waitFor(RelayEnvironnementProvider, initialisationPromise);
