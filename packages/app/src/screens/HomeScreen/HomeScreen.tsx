import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
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
  if (!currentUser.profiles?.length) {
    return <WelcomeScreen />;
  }
  return <HomeScreenContent user={currentUser} />;
};

export default relayScreen(HomeScreen, { query: homeScreenQuery });
