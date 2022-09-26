import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { IntlErrorCode } from '@formatjs/intl';
import { useEffect, useMemo, useRef } from 'react';
import { IntlProvider } from 'react-intl';
import { View } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { RelayEnvironmentProvider } from 'react-relay';
import MainTabBar from './components/MainTabBar';
import { useNativeRouter, ScreensRenderer } from './components/NativeRouter';
import createPlatformEnvironment from './helpers/createPlatformEnvironment';
import {
  init as initLocaleHelpers,
  messages,
  useCurrentLocale,
} from './helpers/localeHelpers';
import * as QueryLoader from './helpers/QueryLoader';
import { getRelayEnvironment } from './helpers/relayEnvironment';
import { isRelayScreen } from './helpers/relayScreen';
import { init as initTokensStore } from './helpers/tokensStore';
import waitFor from './helpers/waitFor';
import ForgotPasswordMobileScreen from './mobileScreens/ForgotPasswordMobileScreen';
import HomeMobileScreen from './mobileScreens/HomeMobileScreen';
import PostCreationMobileScreen from './mobileScreens/PostCreationMobileScreen';
import PostMobileScreen from './mobileScreens/PostMobileScreen';
import SettingsMobileScreen from './mobileScreens/SettingsMobileScreen';
import SignInMobileScreen from './mobileScreens/SignInMobileScreen';
import SignUpMobileScreen from './mobileScreens/SignUpMobileScreen';
import UserMobileScreen from './mobileScreens/UserMobileScreen';
import UserPostsMobileScreen from './mobileScreens/UserPostsMobileScreen';
import { PlatformEnvironmentProvider } from './PlatformEnvironment';
import type { NativeRouterInit } from './components/NativeRouter';

const screens = {
  HOME: HomeMobileScreen,
  SEARCH: () => <View />,
  SETTINGS: SettingsMobileScreen,
  CHAT: () => <View />,
  SIGN_IN: SignInMobileScreen,
  SIGN_UP: SignUpMobileScreen,
  FORGOT_PASSWORD: ForgotPasswordMobileScreen,
  USER: UserMobileScreen,
  POST: PostMobileScreen,
  USER_POSTS: UserPostsMobileScreen,
  NEW_POST: PostCreationMobileScreen,
};

const tabs = {
  MAIN_TAB: MainTabBar,
};

const initialRoutes: NativeRouterInit = {
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
  QueryLoader.init();
  QueryLoader.loadQueryFor('HOME', HomeMobileScreen);
};

const initialisationPromise = init();

const App = () => {
  const { router, routerState } = useNativeRouter(initialRoutes);

  const platformEnvironment = useMemo(
    () => createPlatformEnvironment(router),
    [router],
  );

  const screenIdToDispose = useRef<string[]>([]).current;
  useEffect(() => {
    router.addScreenWillBePushedListener(({ id, route: { route, params } }) => {
      const Component = screens[route];
      if (isRelayScreen(Component)) {
        QueryLoader.loadQueryFor(id, Component, params);
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
    screenIdToDispose.forEach(screen => QueryLoader.disposeQueryFor(screen));
  };

  const locale = useCurrentLocale();

  const onIntlError = (err: any) => {
    if (__DEV__ && err.code === IntlErrorCode.MISSING_TRANSLATION) {
      return;
    }
    console.error(err);
  };

  return (
    <RelayEnvironmentProvider environment={getRelayEnvironment()}>
      <PlatformEnvironmentProvider value={platformEnvironment}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <IntlProvider
            locale={locale}
            defaultLocale={DEFAULT_LOCALE}
            messages={messages[locale]}
            onError={onIntlError}
          >
            <ScreensRenderer
              routerState={routerState}
              screens={screens}
              tabs={tabs}
              onScreenDismissed={onScreenDismissed}
              onFinishTransitioning={onFinishTransitioning}
            />
          </IntlProvider>
        </SafeAreaProvider>
      </PlatformEnvironmentProvider>
    </RelayEnvironmentProvider>
  );
};

export default waitFor(App, initialisationPromise);
