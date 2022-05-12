import UserScreen, { userScreenByNameQuery } from '@azzapp/app/lib/UserScreen';
import Head from 'next/head';
import { useLazyLoadQuery } from 'react-relay';
import { preloadServerQuery } from '../helpers/relayServer';
import type { UserScreenByUserNameQuery } from '@azzapp/app/lib/UserScreen';
import type { GetStaticPaths, GetStaticProps } from 'next';

const UserPage = ({ userName }: { userName: string }) => {
  const data = useLazyLoadQuery<UserScreenByUserNameQuery>(
    userScreenByNameQuery,
    { userName },
  );
  return (
    <div>
      <Head>
        <title>Azzapp</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <UserScreen user={data.user} viewer={data.viewer} />
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async context => {
  const { userName } = context.params ?? {};
  if (!userName) {
    return { notFound: true };
  }
  const { initialRecords, data } =
    await preloadServerQuery<UserScreenByUserNameQuery>(userScreenByNameQuery, {
      userName,
    });

  if (!data?.user) {
    return { notFound: true };
  }

  return {
    props: {
      userName,
      initialRecords,
    },
    revalidate: 10,
  };
};

export default UserPage;
