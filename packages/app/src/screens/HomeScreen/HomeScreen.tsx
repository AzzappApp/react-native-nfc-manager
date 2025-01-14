import LottieView from 'lottie-react-native';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { replaceColors } from '@azzapp/shared/lottieHelpers';
import { mainRoutes } from '#mobileRoutes';
import { setMainTabBarOpacity } from '#components/MainTabBar';
import { useRouter } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { useSaveOfflineVCard } from '#helpers/offlineVCard';
import relayScreen from '#helpers/relayScreen';
import { TooltipProvider } from '#helpers/TooltipContext';
import { useDeepLinkStoredRoute } from '#hooks/useDeepLink';
import { useRevenueCat } from '#hooks/useRevenueCat';
import { useSetRevenueCatUserInfo } from '#hooks/useSetRevenueCatUserInfo';
import Container from '#ui/Container';
import HomeScreenContent from './HomeScreenContent';
import { HomeScreenProvider } from './HomeScreenContext';
import HomeScreenPrefetcher from './HomeScreenPrefetcher';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { HomeScreenQuery } from '#relayArtifacts/HomeScreenQuery.graphql';
import type { HomeRoute } from '#routes';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';

export const homeScreenQuery = graphql`
  query HomeScreenQuery {
    currentUser {
      id
      profiles {
        id
        ...OfflineVCardScreen_profiles
      }
      ...HomeScreenContent_user
      ...HomeScreenContext_user
      ...HomeScreenPrefetcher_user
      ...HomeBottomPanel_user
    }
  }
`;

const HomeScreen = ({
  preloadedQuery,
  hasFocus,
  refreshQuery,
}: RelayScreenProps<HomeRoute, HomeScreenQuery>) => {
  //we need to wait the initial screen to be load before doing any deep link
  useDeepLinkStoredRoute();
  useSetRevenueCatUserInfo();

  const { currentUser } = usePreloadedQuery(homeScreenQuery, preloadedQuery);
  useRevenueCat(currentUser?.id);
  const router = useRouter();

  useEffect(() => {
    if (hasFocus) {
      dispatchGlobalEvent({ type: 'READY' });
    }
  }, [hasFocus]);

  useEffect(() => {
    //if not profile, launch onboarding (except if we are in offline mode)
    if (
      (!currentUser?.profiles || currentUser.profiles.length === 0) &&
      hasFocus
    ) {
      router.replaceAll(mainRoutes(true));
    }
  }, [currentUser, currentUser?.profiles, hasFocus, router]);

  useSaveOfflineVCard(currentUser?.profiles);

  const ref = useRef<CarouselSelectListHandle | null>(null);

  const onIndexChange = (index: number) => {
    ref.current?.scrollToIndex(index, false);
  };

  if (!currentUser) {
    // should never happen
    return null;
  }

  return (
    <Suspense>
      <HomeScreenProvider userKey={currentUser} onIndexChange={onIndexChange}>
        <TooltipProvider>
          <HomeScreenContent
            user={currentUser}
            selectListRef={ref}
            refreshQuery={refreshQuery}
          />
          <HomeScreenPrefetcher user={currentUser} />
        </TooltipProvider>
      </HomeScreenProvider>
    </Suspense>
  );
};

const lottie = require('./assets/home-loader.json');

const HomeScreenFallback = () => {
  useEffect(() => {
    setMainTabBarOpacity(0);
  }, []);
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
  useOfflineCache: true,
  refreshOnFocus: true,
});
