import { Suspense, useEffect, useRef } from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import { HomeIcon } from '#components/HomeIcon';
import { setMainTabBarOpacity } from '#components/MainTabBar';
import { useRouter } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { useSaveOfflineVCard } from '#helpers/offlineVCard';
import relayScreen from '#helpers/relayScreen';
import { TooltipProvider } from '#helpers/TooltipContext';
import { useDeepLinkStoredRoute } from '#hooks/useDeepLink';
import { useQuickActions } from '#hooks/useQuickActions';
import { useRevenueCat } from '#hooks/useRevenueCat';
import { useSetRevenueCatUserInfo } from '#hooks/useSetRevenueCatUserInfo';
import AzzappLogoLoader from '#ui/AzzappLogoLoader';
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
      ...useSetRevenueCatUserInfo_user
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
  useQuickActions();

  const { currentUser } = usePreloadedQuery(homeScreenQuery, preloadedQuery);

  useSetRevenueCatUserInfo(currentUser);
  useRevenueCat(currentUser?.id);

  const router = useRouter();

  useEffect(() => {
    HomeIcon.forceRefresh();
  }, []);

  useEffect(() => {
    //current user is fetched on welcome screen / when null the app is in infinite loop
    if (!currentUser) {
      dispatchGlobalEvent({ type: 'SIGN_OUT' });
      return;
    }
  }, [currentUser, currentUser?.profiles, hasFocus, router]);

  useSaveOfflineVCard(currentUser?.profiles);

  const ref = useRef<CarouselSelectListHandle | null>(null);

  if (
    !currentUser ||
    !currentUser.profiles ||
    currentUser.profiles.length === 0
  ) {
    return null;
  }

  return (
    <Suspense>
      <HomeScreenProvider userKey={currentUser}>
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

const HomeScreenFallback = () => {
  useEffect(() => {
    setMainTabBarOpacity(0);
  }, []);

  return <AzzappLogoLoader />;
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
