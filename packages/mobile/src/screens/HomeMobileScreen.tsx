import HomeScreen, { homeScreenQuery } from '@azzapp/app/lib/HomeScreen';
import { resetEnvironment } from '../helpers/relayEnvironment';
import { clearTokens } from '../helpers/tokensStore';
import type { HomeScreenQuery } from '@azzapp/app/lib/HomeScreen';

const HomeMobileScreen = ({
  data,
}: {
  data: HomeScreenQuery['response'];
  componentId: string;
}) => {
  const logout = async () => {
    await clearTokens();
    resetEnvironment();
  };
  return <HomeScreen data={data} logout={logout} />;
};

export { homeScreenQuery };

export default HomeMobileScreen;
