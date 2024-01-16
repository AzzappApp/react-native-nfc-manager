import { useEffect } from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
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

  useEffect(() => {
    if (hasFocus) {
      dispatchGlobalEvent({ type: 'READY' });
    }
  }, [hasFocus]);

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
  webCardBound: false,
  fallback: HomeScreenFallback,
  canGoBack: false,
  pollInterval: 30000,
});
