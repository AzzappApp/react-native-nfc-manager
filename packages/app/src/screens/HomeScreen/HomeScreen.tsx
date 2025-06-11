import { Suspense, useEffect } from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import { HomeIcon } from '#components/HomeIcon';
import { useRouter } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { useSaveOfflineVCard } from '#helpers/offlineVCard';
import relayScreen from '#helpers/relayScreen';
import { TooltipProvider } from '#helpers/TooltipContext';
import { useDeepLinkStoredRoute } from '#hooks/useDeepLink';
import { useQuickActions } from '#hooks/useQuickActions';
import { useSetRevenueCatUserInfo } from '#hooks/useSetRevenueCatUserInfo';
import AzzappLogoLoader from '#ui/AzzappLogoLoader';
import HomeScreenContent from './HomeScreenContent';
import { HomeScreenProvider } from './HomeScreenContext';
import HomeScreenPrefetcher from './HomeScreenPrefetcher';
import { HomeScreenUpgradePopup } from './HomeScreenUpgradePopup';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { HomeScreenQuery } from '#relayArtifacts/HomeScreenQuery.graphql';
import type { HomeRoute } from '#routes';

export const homeScreenQuery = graphql`
  query HomeScreenQuery {
    currentUser {
      isPremium
      hasProfiles #do not remove, used to update the field in a relay way #fix9258
      profiles {
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
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

  useSaveOfflineVCard(currentUser?.profiles, currentUser?.isPremium);

  if (!currentUser?.profiles || currentUser.profiles.length === 0) {
    return null;
  }

  return (
    <Suspense>
      <HomeScreenProvider userKey={currentUser}>
        <TooltipProvider>
          <HomeScreenUpgradePopup />
          <HomeScreenContent user={currentUser} refreshQuery={refreshQuery} />
          <HomeScreenPrefetcher user={currentUser} />
        </TooltipProvider>
      </HomeScreenProvider>
    </Suspense>
  );
};

const HomeScreenFallback = () => {
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
