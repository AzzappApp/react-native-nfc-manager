import SearchScreen from '@azzapp/app/lib/screens/SearchScreen';
import useClientLazyLoadQuery from '@azzapp/shared/lib/useClientLazyLoadQuery';
import Head from 'next/head';
import { graphql } from 'react-relay';
import { getMessages } from '../helpers/i18nmessages';
import type { searchPageQuery } from '@azzapp/relay/artifacts/searchPageQuery.graphql';
import type { GetStaticProps } from 'next';
const SearchPage = () => {
  const data = useClientLazyLoadQuery<searchPageQuery>(
    graphql`
      query searchPageQuery {
        viewer {
          ...SearchScreen_viewer
        }
      }
    `,
    {},
  );

  return (
    <div className="root">
      <Head>
        <title>Search</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <SearchScreen viewer={data.viewer} />
    </div>
  );
};
export const getStaticProps: GetStaticProps = context => {
  return {
    props: {
      i18nMessages: getMessages('search', context.locale),
    },
  };
};

export default SearchPage;
