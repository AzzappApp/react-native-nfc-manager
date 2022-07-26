import { graphql, usePreloadedQuery } from 'react-relay';
import { resetEnvironment } from '../helpers/relayEnvironment';
import relayScreen from '../helpers/relayScreen';
import { clearTokens } from '../helpers/tokensStore';
import HomeScreen from '../HomeScreen';
import type { HomeMobileScreenQuery } from '@azzapp/relay/artifacts/HomeMobileScreenQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

const homeScreenQuery = graphql`
  query HomeMobileScreenQuery {
    viewer {
      ...HomeScreen_viewer
    }
  }
`;

const HomeMobileScreen = ({
  preloadedQuery,
}: {
  preloadedQuery: PreloadedQuery<HomeMobileScreenQuery>;
}) => {
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
