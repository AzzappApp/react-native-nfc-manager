import HomeScreen, { homeScreenQuery } from '@azzapp/app/lib/HomeScreen';
import { usePreloadedQuery } from 'react-relay';
import { resetEnvironment } from '../helpers/relayEnvironment';
import relayScreen from '../helpers/relayScreen';
import { clearTokens } from '../helpers/tokensStore';
import type { HomeScreenQuery } from '@azzapp/app/lib/HomeScreen';
import type { PreloadedQuery } from 'react-relay';

const HomeMobileScreen = ({
  preloadedQuery,
}: {
  preloadedQuery: PreloadedQuery<HomeScreenQuery>;
}) => {
  const data = usePreloadedQuery(homeScreenQuery, preloadedQuery);
  const logout = async () => {
    await clearTokens();
    resetEnvironment();
  };
  return <HomeScreen data={data} logout={logout} />;
};

export default relayScreen(HomeMobileScreen, {
  query: homeScreenQuery,
});
