import { useEffect, useMemo, useRef } from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import { mainRoutes } from '#mobileRoutes';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
import { useRouter } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import { useDeepLinkStoredRoute } from '#hooks/useDeepLink';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import HomeScreenContent from './HomeScreenContent';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { HomeScreenQuery } from '#relayArtifacts/HomeScreenQuery.graphql';
import type { HomeRoute } from '#routes';

export const homeScreenQuery = graphql`
  query HomeScreenQuery {
    currentUser {
      profiles {
        id
      }
      ...HomeScreenContent_user
    }
  }
`;

const HomeScreen = ({
  preloadedQuery,
  hasFocus,
}: RelayScreenProps<HomeRoute, HomeScreenQuery>) => {
  //we need to wait the initial screen to be load before doing any deep link
  useDeepLinkStoredRoute();
  // dat
  const { currentUser } = usePreloadedQuery(homeScreenQuery, preloadedQuery);
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

  const prevHasProfile = useRef(hasProfile);

  useEffect(() => {
    if (!hasProfile && prevHasProfile.current) {
      prevHasProfile.current = false;
      router.replaceAll(mainRoutes(true));
    }
  }, [hasProfile, router]);

  if (!currentUser) {
    // should never happen
    return null;
  }

  return <HomeScreenContent user={currentUser} />;
};

const HomeScreenFallback = () => {
  useMainTabBarVisibilityController(false);

  return (
    <Container
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator />
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
