import LottieView from 'lottie-react-native';
import { Suspense, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { replaceColors } from '@azzapp/shared/lottieHelpers';
import { mainRoutes } from '#mobileRoutes';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
import { useRouter } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import { useDeepLinkStoredRoute } from '#hooks/useDeepLink';
// import { useRevenueCat } from '#hooks/useRevenueCat';
//import { useSetRevenueCatUserInfo } from '#hooks/useSetRevenueCatUserInfo';
import Container from '#ui/Container';
import HomeScreenContent from './HomeScreenContent';
import { HomeScreenProvider } from './HomeScreenContext';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { HomeScreenQuery } from '#relayArtifacts/HomeScreenQuery.graphql';
import type { HomeRoute } from '#routes';

export const homeScreenQuery = graphql`
  query HomeScreenQuery {
    currentUser {
      id
      profiles {
        id
      }
      ...HomeScreenContent_user
      ...HomeScreenContext_user
    }
  }
`;

const HomeScreen = ({
  preloadedQuery,
  hasFocus,
}: RelayScreenProps<HomeRoute, HomeScreenQuery>) => {
  //we need to wait the initial screen to be load before doing any deep link
  useDeepLinkStoredRoute();
  //useSetRevenueCatUserInfo();

  const { currentUser } = usePreloadedQuery(homeScreenQuery, preloadedQuery);
  // useRevenueCat(currentUser?.id);
  const router = useRouter();

  useEffect(() => {
    if (hasFocus) {
      dispatchGlobalEvent({ type: 'READY' });
    }
  }, [hasFocus]);

  const hasProfile = useMemo(() => {
    if (!currentUser?.profiles) return false;
    return currentUser.profiles.length > 0;
  }, [currentUser?.profiles]);

  useEffect(() => {
    //if not profile, launch onboarding
    if (!hasProfile) {
      router.replaceAll(mainRoutes(true));
    }
  }, [hasProfile, router]);

  if (!currentUser) {
    // should never happen
    return null;
  }

  return (
    <Suspense>
      <HomeScreenProvider userKey={currentUser}>
        <HomeScreenContent user={currentUser} />
      </HomeScreenProvider>
    </Suspense>
  );
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const lottie = require('./assets/home-loader.json');

const HomeScreenFallback = () => {
  useMainTabBarVisibilityController(false);
  const colorScheme = useColorScheme() ?? 'light';

  const source = useMemo(
    () =>
      colorScheme === 'light'
        ? lottie
        : replaceColors(
            [
              {
                sourceColor: '#000000',
                targetColor: '#ffffff',
              },
            ],
            lottie,
          ),
    [colorScheme],
  );

  return (
    <Container
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LottieView
        source={source}
        autoPlay
        loop
        hardwareAccelerationAndroid
        style={{
          width: 150,
          height: 150,
        }}
      />
    </Container>
  );
};

export default relayScreen(HomeScreen, {
  query: homeScreenQuery,
  profileBound: false,
  fallback: HomeScreenFallback,
  canGoBack: false,
  pollInterval: 30000,
});
