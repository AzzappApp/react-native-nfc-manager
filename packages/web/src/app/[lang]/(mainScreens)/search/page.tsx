import { redirect } from 'next/navigation';
import SearchWebScreenQueryNode from '@azzapp/relay/artifacts/SearchWebScreenQuery.graphql';
import preloadServerQuery from '../../../../helpers/preloadServerQuery';
import { getAuthInfos } from '../../../../helpers/session';
import SearchWebScreen from './SearchWebScreen';
import type { SearchWebScreenQuery } from '@azzapp/relay/artifacts/SearchWebScreenQuery.graphql';

const SearchPage = async () => {
  const authInfos = await getAuthInfos();
  if (authInfos.isAnonymous) {
    redirect('/signin?next=/');
  }
  const serverQuery = await preloadServerQuery<SearchWebScreenQuery>(
    SearchWebScreenQueryNode,
    {},
    authInfos,
  );

  return <SearchWebScreen serverQuery={serverQuery} />;
};

export default SearchPage;

export const dynamic = 'force-dynamic';
