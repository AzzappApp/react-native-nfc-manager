import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/lib/cardHelpers';
import { useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useNativeNavigationEvent } from '../components/NativeRouter';
import relayScreen from '../helpers/relayScreen';
import { useRouter } from '../PlatformEnvironment';
import UserScreen from '../screens/UserScreen';
import type { CoverHandle } from '../components/CoverRenderer';
import type { ScreenOptions } from '../components/NativeRouter';
import type { RelayScreenProps } from '../helpers/relayScreen';
import type { UserRoute } from '../routes';
import type { UserMobileScreenByIdQuery } from '@azzapp/relay/artifacts/UserMobileScreenByIdQuery.graphql';
import type { UserMobileScreenByUserNameQuery } from '@azzapp/relay/artifacts/UserMobileScreenByUserNameQuery.graphql';

const UserMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  UserRoute,
  UserMobileScreenByIdQuery | UserMobileScreenByUserNameQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  const [ready, setReady] = useState(false);

  useNativeNavigationEvent('appear', () => {
    setReady(true);
  });

  const coverRef = useRef<CoverHandle>(null);
  const router = useRouter();
  const onBack = async () => {
    if (params.setOriginCoverState && coverRef.current) {
      await coverRef.current.snapshot();
      params.setOriginCoverState({
        imageIndex: coverRef.current.getCurrentImageIndex(),
        videoTime: await coverRef.current.getCurrentVideoTime(),
      });
    }
    router.back();
  };

  if (!data.user) {
    return null;
  }

  return (
    <UserScreen
      user={data.user}
      viewer={data.viewer}
      ready={ready}
      onBack={onBack}
      coverRef={coverRef}
      initialImageIndex={params.imageIndex}
      initialVideoTime={params.videoTime}
    />
  );
};

const getQuery = (params: UserRoute['params']) =>
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

UserMobileScreen.getScreenOptions = ({
  fromRectangle,
}: UserRoute['params']): ScreenOptions | null => {
  if (!fromRectangle) {
    return null;
  }
  const windowWidth = Dimensions.get('window').width;
  return {
    stackAnimation: 'custom',
    stackAnimationOptions: {
      animator: 'reveal',
      fromRectangle,
      toRectangle: {
        x: 0,
        y: 0,
        width: windowWidth,
        height: windowWidth / COVER_RATIO,
      },
      fromRadius: COVER_CARD_RADIUS * windowWidth,
      toRadius: 0,
    },
    transitionDuration: 220,
    customAnimationOnSwipe: true,
    gestureEnabled: true,
  };
};

export default relayScreen(UserMobileScreen, {
  query: getQuery,
  getVariables: ({ userName, userId }) => (userId ? { userId } : { userName }),
});
