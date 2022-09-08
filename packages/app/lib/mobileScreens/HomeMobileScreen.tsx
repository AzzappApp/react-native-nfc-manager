import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '../helpers/relayScreen';
import HomeScreen from '../screens/HomeScreen';
import type { RelayScreenProps } from '../helpers/relayScreen';
import type { HomeRoute } from '../routes';
import type { HomeMobileScreenQuery } from '@azzapp/relay/artifacts/HomeMobileScreenQuery.graphql';

const homeScreenQuery = graphql`
  query HomeMobileScreenQuery {
    viewer {
      ...HomeScreen_viewer
    }
  }
`;

const HomeMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<HomeRoute, HomeMobileScreenQuery>) => {
  const data = usePreloadedQuery(homeScreenQuery, preloadedQuery);
  return <HomeScreen viewer={data.viewer} />;
};

export default relayScreen(HomeMobileScreen, {
  query: homeScreenQuery,
});
