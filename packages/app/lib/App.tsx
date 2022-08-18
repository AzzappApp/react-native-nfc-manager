import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { RelayEnvironmentProvider } from 'react-relay';
import MainTabBar from './components/MaintTabBar';
import { useNativeRouter, ScreensRenderer } from './components/NativeRouter';
import createPlatformEnvironment from './helpers/createPlatformEnvironment';
import * as QueryLoader from './helpers/QueryLoader';
import { getRelayEnvironment } from './helpers/relayEnvironment';
import { isRelayScreen } from './helpers/relayScreen';
import { init as initTokensStore } from './helpers/tokensStore';
import waitFor from './helpers/waitFor';
import HomeMobileScreen from './mobileScreens/HomeMobileScreen';
import SignInMobileScreen from './mobileScreens/SignInMobileScreen';
import SignUpMobileScreen from './mobileScreens/SignUpMobileScreen';
import UserMobileScreen from './mobileScreens/UserMobileScreen';
import UserPostsMobileScreen from './mobileScreens/UserPostsMobileScreen';
import { PlatformEnvironmentProvider } from './PlatformEnvironment';
import PostCreationScreen from './PostCreationScreen';

const screens = {
  HOME: HomeMobileScreen,
  SEARCH: () => <View />,
  SETTINGS: () => <View />,
  CHAT: () => <View />,
  SIGN_IN: SignInMobileScreen,
  SIGN_UP: SignUpMobileScreen,
  USER: UserMobileScreen,
  USER_POSTS: UserPostsMobileScreen,
  NEW_POST: PostCreationScreen,
};

const tabs = {
  MAIN_TAB: MainTabBar,
};

export const init = async () => {
  await initTokensStore();
  QueryLoader.init();
  QueryLoader.loadQueryFor('HOME', HomeMobileScreen);
};

const initialisationPromise = init();

const App = () => {
  const { router, routerState } = useNativeRouter({
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
  });

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

  return (
    <RelayEnvironmentProvider environment={getRelayEnvironment()}>
      <PlatformEnvironmentProvider value={platformEnvironment}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ScreensRenderer
            routerState={routerState}
            screens={screens}
            tabs={tabs}
            onScreenDismissed={onScreenDismissed}
            onFinishTransitioning={onFinishTransitioning}
          />
        </SafeAreaProvider>
      </PlatformEnvironmentProvider>
    </RelayEnvironmentProvider>
  );
};

export default waitFor(App, initialisationPromise);
