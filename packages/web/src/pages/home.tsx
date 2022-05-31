import HomeScreen, { homeScreenQuery } from '@azzapp/app/lib/HomeScreen';
import { useWebAPI } from '@azzapp/app/lib/PlatformEnvironment';
import Head from 'next/head';
import { useLazyLoadQuery } from 'react-relay';
import { preloadServerQuery } from '../helpers/relayServer';
import { getRequestAuthInfos, withSessionSsr } from '../helpers/session';
import type { HomeScreenQuery } from '@azzapp/app/lib/HomeScreen';
import type { GetServerSideProps } from 'next';

const HomePage = () => {
  const WebAPI = useWebAPI();
  const data = useLazyLoadQuery<HomeScreenQuery>(homeScreenQuery, {});
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
      <HomeScreen data={data} logout={logout} />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async ({ req }) => {
    const authInfos = await getRequestAuthInfos(req);
    const { initialRecords } = await preloadServerQuery(
      homeScreenQuery,
      {},
      authInfos,
    );
    return {
      props: { initialRecords },
    };
  },
);

export default HomePage;
