import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import useToggle from '#hooks/useToggle';
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
}: RelayScreenProps<HomeRoute, HomeScreenQuery>) => {
  // data
  const { currentUser } = usePreloadedQuery(homeScreenQuery, preloadedQuery);
  const hasProfiles = !!currentUser.profiles?.length;

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

export default relayScreen(HomeScreen, {
  query: homeScreenQuery,
  canGoback: false,
});
