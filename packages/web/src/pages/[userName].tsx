import { useRouter } from '@azzapp/app/lib/PlatformEnvironment';
import UserScreen from '@azzapp/app/lib/screens/UserScreen';
import Head from 'next/head';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { preloadServerQuery } from '../helpers/relayServer';
import useClientLazyLoadQuery from '../helpers/useClientLazyLoadQuery';
import type { UserNamePageUserQuery } from '@azzapp/relay/artifacts/UserNamePageUserQuery.graphql';
import type { UserNamePageViewerQuery } from '@azzapp/relay/artifacts/UserNamePageViewerQuery.graphql';
import type { GetStaticPaths, GetStaticProps } from 'next';

export const userScreenByNameQuery = graphql`
  query UserNamePageUserQuery($userName: String!) {
    user(userName: $userName) {
      ...UserScreenFramgent_user
    }
  }
`;

export const userScreenViewerQuery = graphql`
  query UserNamePageViewerQuery {
    viewer {
      ...UserScreenFramgent_viewer
    }
  }
`;

const UserPage = ({ userName }: { userName: string }) => {
  const { user } = useLazyLoadQuery<UserNamePageUserQuery>(
    userScreenByNameQuery,
    { userName },
  );

  const { viewer } = useClientLazyLoadQuery<UserNamePageViewerQuery>(
    userScreenViewerQuery,
    {},
  );

  const router = useRouter();
  const onBack = () => {
    router.back();
  };

  return (
    <div className="root">
      <Head>
        <title>Azzapp</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <UserScreen onBack={onBack} user={user!} viewer={viewer} />
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
    await preloadServerQuery<UserNamePageUserQuery>(userScreenByNameQuery, {
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
