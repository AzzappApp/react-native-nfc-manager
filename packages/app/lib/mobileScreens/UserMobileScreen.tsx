import { useEffect, useState } from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '../helpers/relayScreen';
import UserScreen from '../UserScreen';
import type { ScreenOptions } from '../components/NativeRouter';
import type { UserMobileScreenByIdQuery } from '@azzapp/relay/artifacts/UserMobileScreenByIdQuery.graphql';
import type { UserMobileScreenByUserNameQuery } from '@azzapp/relay/artifacts/UserMobileScreenByUserNameQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

type UserMobileScreenParams = {
  userName: string;
  userId?: string;
  useSharedAnimation?: boolean;
};

type UserMobileScreenProps = {
  preloadedQuery: PreloadedQuery<
    UserMobileScreenByIdQuery | UserMobileScreenByUserNameQuery
  >;
  params: UserMobileScreenParams;
};

const UserMobileScreen = ({
  preloadedQuery,
  params,
}: UserMobileScreenProps) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    // TODO implement will appear hook
    const timeout = setTimeout(() => {
      setCanPlay(true);
    }, 300);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return <UserScreen user={data.user} viewer={data.viewer} canPlay={canPlay} />;
};

const getQuery = (params: UserMobileScreenParams) =>
  params.userId ? userScreenByIdQuery : userScreenByNameQuery;

const userScreenByIdQuery = graphql`
  query UserMobileScreenByIdQuery($userId: ID!) {
    user: node(id: $userId) {
      ...UserScreenFramgent_user
    }
    viewer {
      ...UserScreenFramgent_viewer
    }
  }
`;

const userScreenByNameQuery = graphql`
  query UserMobileScreenByUserNameQuery($userName: String!) {
    user(userName: $userName) {
      ...UserScreenFramgent_user
    }
    viewer {
      ...UserScreenFramgent_viewer
    }
  }
`;

export { userScreenByIdQuery, userScreenByNameQuery };

UserMobileScreen.getScreenOptions = ({
  userName,
  useSharedAnimation,
}: UserMobileScreenParams): ScreenOptions | null => {
  if (useSharedAnimation === false) {
    return null;
  }
  return {
    transitionDuration: 100,
    stackAnimation: 'fade',
    sharedElementTransitions: [
      {
        from: `cover-${userName}-image-0`,
        to: `user-screen-cover-${userName}-image-0`,
        duration: 300,
        easing: 'ease-out',
      },
      {
        from: `cover-${userName}-overlay`,
        to: `user-screen-cover-${userName}-overlay`,
        duration: 300,
        easing: 'ease-out',
      },
      {
        from: `cover-${userName}-text`,
        to: `user-screen-cover-${userName}-text`,
        duration: 300,
        easing: 'ease-out',
      },
      {
        from: `cover-${userName}-qrCode`,
        to: `user-screen-cover-${userName}-qrCode`,
        duration: 300,
        easing: 'ease-out',
      },
    ],
  };
};

export default relayScreen(UserMobileScreen, {
  query: getQuery,
  getVariables: ({ userName, userId }) => (userId ? { userId } : { userName }),
});
