import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '../helpers/relayScreen';
import SearchScreen from '../screens/SearchScreen';
import type { RelayScreenProps } from '../helpers/relayScreen';
import type { SearchRoute } from '../routes';
import type { SearchMobileScreenQuery } from '@azzapp/relay/artifacts/SearchMobileScreenQuery.graphql';

const searchScreenQuery = graphql`
  query SearchMobileScreenQuery {
    viewer {
      ...SearchScreen_viewer
    }
  }
`;

const SearchMobileScreen = ({
  preloadedQuery,
  hasFocus,
}: RelayScreenProps<SearchRoute, SearchMobileScreenQuery>) => {
  const data = usePreloadedQuery(searchScreenQuery, preloadedQuery);
  return <SearchScreen viewer={data.viewer} hasFocus={hasFocus} />;
};

export default relayScreen(SearchMobileScreen, {
  query: searchScreenQuery,
});
