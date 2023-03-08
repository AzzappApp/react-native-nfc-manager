import { redirect } from 'next/navigation';
import { getViewer } from '@azzapp/auth/viewer';
import SearchWebScreenQueryNode from '@azzapp/relay/artifacts/SearchWebScreenQuery.graphql';
import preloadServerQuery from '#helpers/preloadServerQuery';
import SearchWebScreen from './SearchWebScreen';
import type { SearchWebScreenQuery } from '@azzapp/relay/artifacts/SearchWebScreenQuery.graphql';

const SearchPage = async () => {
  const viewer = await getViewer();
  if (viewer.isAnonymous) {
    redirect('/signin?next=/');
  }
  const serverQuery = await preloadServerQuery<SearchWebScreenQuery>(
    SearchWebScreenQueryNode,
    {},
    viewer,
  );

  return <SearchWebScreen serverQuery={serverQuery} />;
};

export default SearchPage;

export const dynamic = 'force-dynamic';
