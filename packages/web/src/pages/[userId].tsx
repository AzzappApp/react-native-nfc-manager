import UserScreen, { userScreenQuery } from '@azzapp/app/lib/UserScreen';
import Head from 'next/head';
import { useLazyLoadQuery } from 'react-relay';
import { preloadServerQuery } from '../helpers/relayServer';
import type { UserScreenQuery } from '@azzapp/app/lib/UserScreen';
import type { GetServerSideProps } from 'next';

const UserPage = ({ userId }: { userId: string }) => {
  const data = useLazyLoadQuery<UserScreenQuery>(userScreenQuery, { userId });
  return (
    <div>
      <Head>
        <title>Azzapp</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <UserScreen data={data} params={{ userId }} />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async context => {
  const queryInfos = await preloadServerQuery(userScreenQuery, {
    userId: context.query.userId,
  });
  return {
    props: {
      userId: context.query.userId,
      ...queryInfos,
    },
  };
};

export default UserPage;
