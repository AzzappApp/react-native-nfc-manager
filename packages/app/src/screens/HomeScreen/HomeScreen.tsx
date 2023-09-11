import { useEffect } from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useMainTabBarVisiblilityController } from '#components/MainTabBar';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import useToggle from '#hooks/useToggle';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import HomeBottomSheetPanel from './HomeBottomSheetPanel';
import HomeScreenContent from './HomeScreenContent';
import WelcomeScreen from './WelcomeScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { HomeRoute } from '#routes';
import type { HomeScreenQuery } from '@azzapp/relay/artifacts/HomeScreenQuery.graphql';

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
  // data
  const { currentUser } = usePreloadedQuery(homeScreenQuery, preloadedQuery);
  const hasProfiles = !!currentUser.profiles?.length;

  useEffect(() => {
    if (hasFocus) {
      dispatchGlobalEvent({ type: 'READY' });
    }
  }, [hasFocus]);

  const [showMenu, toggleShowMenu] = useToggle(false);
  return (
    <>
      {hasProfiles ? (
        <HomeScreenContent user={currentUser} onShowMenu={toggleShowMenu} />
      ) : (
        <WelcomeScreen onShowMenu={toggleShowMenu} />
      )}
      <HomeBottomSheetPanel visible={showMenu} close={toggleShowMenu} />
    </>
  );
};

const HomeScreenFallback = () => {
  useMainTabBarVisiblilityController(false);

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
  fallback: HomeScreenFallback,
  canGoback: false,
});
