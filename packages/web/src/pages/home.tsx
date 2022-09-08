import HomeScreen from '@azzapp/app/lib/screens/HomeScreen';
import Head from 'next/head';
import { graphql } from 'react-relay';
import ClientOnlySuspense from '../components/ClientSuspence';
import useClientLazyLoadQuery from '../helpers/useClientLazyLoadQuery';
import type { homePageQuery } from '@azzapp/relay/artifacts/homePageQuery.graphql';

const HomePage = () => {
  const data = useClientLazyLoadQuery<homePageQuery>(
    graphql`
      query homePageQuery {
        viewer {
          ...HomeScreen_viewer
        }
      }
    `,
    {},
  );

  return (
    <div className="root">
      <Head>
        <title>Azzapp</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <ClientOnlySuspense fallback={null}>
        <HomeScreen viewer={data.viewer} />
      </ClientOnlySuspense>
    </div>
  );
};

export default HomePage;
