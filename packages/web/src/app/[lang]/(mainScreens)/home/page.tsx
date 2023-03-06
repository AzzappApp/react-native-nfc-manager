import { redirect } from 'next/navigation';
import HomeWebScreenQueryNode from '@azzapp/relay/artifacts/HomeWebScreenQuery.graphql';
import preloadServerQuery from '#helpers/preloadServerQuery';
import { getViewerInfos } from '#helpers/sessionHelpers';
import HomeWebScreen from './HomeWebScreen';
import type { HomeWebScreenQuery } from '@azzapp/relay/artifacts/HomeWebScreenQuery.graphql';

const HomePage = async () => {
  const viewer = await getViewerInfos();

  if (viewer.isAnonymous) {
    return redirect('/signin');
  }

  const serverQuery = await preloadServerQuery<HomeWebScreenQuery>(
    HomeWebScreenQueryNode,
    {},
    viewer,
  );

  return <HomeWebScreen serverQuery={serverQuery} />;
};

export default HomePage;

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Azzapp - Home',
};
