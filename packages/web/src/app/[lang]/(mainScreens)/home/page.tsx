import { redirect } from 'next/navigation';
import HomeWebScreenQueryNode from '@azzapp/relay/artifacts/HomeWebScreenQuery.graphql';
import preloadServerQuery from '../../../../helpers/preloadServerQuery';
import { getAuthInfos } from '../../../../helpers/session';
import HomeWebScreen from './HomeWebScreen';
import type { HomeWebScreenQuery } from '@azzapp/relay/artifacts/HomeWebScreenQuery.graphql';

const HomePage = async () => {
  const authInfos = await getAuthInfos();

  if (authInfos.isAnonymous) {
    return redirect('/signin');
  }

  const serverQuery = await preloadServerQuery<HomeWebScreenQuery>(
    HomeWebScreenQueryNode,
    {},
    authInfos,
  );

  return <HomeWebScreen serverQuery={serverQuery} />;
};

export default HomePage;

export const dynamic = 'force-dynamic';
