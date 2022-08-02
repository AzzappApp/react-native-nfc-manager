import { graphql, usePreloadedQuery } from 'react-relay';
import { resetEnvironment } from '../helpers/relayEnvironment';
import relayScreen from '../helpers/relayScreen';
import { clearTokens } from '../helpers/tokensStore';
import HomeScreen from '../HomeScreen';
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
  const logout = async () => {
    await clearTokens();
    resetEnvironment();
  };
  return <HomeScreen viewer={data.viewer} logout={logout} />;
};

export default relayScreen(HomeMobileScreen, {
  query: homeScreenQuery,
});
