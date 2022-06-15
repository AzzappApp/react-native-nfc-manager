import HomeScreen from '@azzapp/app/lib/HomeScreen';
import { useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import Head from 'next/head';
import { graphql } from 'react-relay';
import ClientOnlySuspense from '../components/ClientSuspence';
import useClientLazyLoadQuery from '../helpers/useClientLazyLoadQuery';
import type { homePageQuery } from '@azzapp/relay/artifacts/homePageQuery.graphql';

const HomePage = () => {
  const WebAPI = useWebAPI();
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
  const logout = () => {
    WebAPI.logout()
      .then(() => {
        // TODO refresh mechanism?
        window.location.reload();
      })
      .catch(e => {
        // eslint-disable-next-line no-alert
        alert(e);
      });
  };
  return (
    <div className="root">
      <Head>
        <title>Azzapp</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <ClientOnlySuspense fallback={null}>
        <HomeScreen viewer={data.viewer} logout={logout} />
      </ClientOnlySuspense>
    </div>
  );
};

export default HomePage;
