'use client';

import SearchScreen from '@azzapp/app/lib/screens/SearchScreen';
import { graphql } from 'react-relay';
import useServerQuery from '../../../../hooks/useServerQuery';
import type { ServerQuery } from '../../../../helpers/preloadServerQuery';
import type { SearchWebScreenQuery } from '@azzapp/relay/artifacts/SearchWebScreenQuery.graphql';

type SearchWebScreenProps = {
  serverQuery: ServerQuery<SearchWebScreenQuery>;
};

const SearchWebScreen = ({ serverQuery }: SearchWebScreenProps) => {
  const data = useServerQuery<SearchWebScreenQuery>(
    graphql`
      query SearchWebScreenQuery {
        viewer {
          ...SearchScreen_viewer
        }
      }
    `,
    serverQuery,
  );

  return <SearchScreen viewer={data.viewer} />;
};

export default SearchWebScreen;
