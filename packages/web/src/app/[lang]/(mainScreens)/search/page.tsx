import { redirect } from 'next/navigation';
import SearchWebScreenQueryNode from '@azzapp/relay/artifacts/SearchWebScreenQuery.graphql';
import preloadServerQuery from '#helpers/preloadServerQuery';
import { getViewerInfos } from '#helpers/sessionHelpers';
import SearchWebScreen from './SearchWebScreen';
import type { SearchWebScreenQuery } from '@azzapp/relay/artifacts/SearchWebScreenQuery.graphql';

const SearchPage = async () => {
  const viewer = await getViewerInfos();
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
