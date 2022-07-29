import ROUTES from '@azzapp/shared/lib/routes';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { RelayEnvironmentProvider } from 'react-relay';
import {
  createRouterInitialState,
  useNativeRouter,
  ScreensRenderer,
} from './components/NativeRouter';
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
  USER: UserMobileScreen,
  USER_POSTS: UserPostsMobileScreen,
  SIGN_IN: SignInMobileScreen,
  SIGN_UP: SignUpMobileScreen,
  SEARCH: View,
  NEW_POST: PostCreationScreen,
  CHAT: View,
  PROFILE: View,
  POST: View,
};

export const init = async () => {
  await initTokensStore();
  QueryLoader.init();
  QueryLoader.loadQueryFor('HOME', HomeMobileScreen);
};

const initialisationPromise = init();

const App = () => {
  const { router, routerState } = useNativeRouter(
    createRouterInitialState({
      id: 'HOME',
      route: ROUTES.HOME,
    }),
  );

  const platformEnvironment = useMemo(
    () => createPlatformEnvironment(router),
    [router],
  );

  useEffect(() => {
    router.addScreenWillBePushedListener(({ id, route, params }) => {
      const Component = screens[route];
      if (isRelayScreen(Component)) {
        QueryLoader.loadQueryFor(id, Component, params);
      }
    });
    router.addScreenWillBeRemovedListener(({ id }) =>
      QueryLoader.disposeQueryFor(id),
    );
  }, [router]);

  return (
    <RelayEnvironmentProvider environment={getRelayEnvironment()}>
      <PlatformEnvironmentProvider value={platformEnvironment}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ScreensRenderer routerState={routerState} screens={screens} />
        </SafeAreaProvider>
      </PlatformEnvironmentProvider>
    </RelayEnvironmentProvider>
  );
};

export default waitFor(App, initialisationPromise);
