import { COVER_RATIO } from '@azzapp/shared/lib/cardHelpers';
import { useRef, useState } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReanimatedTransitionProgress } from 'react-native-screens/reanimated';
import { graphql, usePreloadedQuery } from 'react-relay';
import { CoverLayout } from '../components/CoverRenderer';
import { queryMediaCache } from '../components/MediaRenderer/mediaCache';
import {
  useNativeNavigationEvent,
  useScreenOptionsUpdater,
} from '../components/NativeRouter';
import SnapshotView, { clearShapshot } from '../components/SnapshotView';
import relayScreen from '../helpers/relayScreen';
import { useRouter } from '../PlatformEnvironment';
import FloatingIconButton from '../ui/FloatingIconButton';
import UserScreen from '../UserScreen';
import type { CoverHandle } from '../components/CoverRenderer/CoverRenderer';
import type { ScreenOptions } from '../components/NativeRouter';
import type { RelayScreenProps } from '../helpers/relayScreen';
import type { UserRoute } from '../routes';
import type {
  UserMobileScreenByIdQuery,
  UserMobileScreenByIdQuery$data,
} from '@azzapp/relay/artifacts/UserMobileScreenByIdQuery.graphql';
import type { UserMobileScreenByUserNameQuery } from '@azzapp/relay/artifacts/UserMobileScreenByUserNameQuery.graphql';
import type { UserScreenFramgent_viewer$key } from '@azzapp/relay/artifacts/UserScreenFramgent_viewer.graphql';

const UserMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  UserRoute,
  UserMobileScreenByIdQuery | UserMobileScreenByUserNameQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  const [ready, setReady] = useState(false);

  const onReady = () => {
    setReady(true);
  };

  const shouldAnimate = params.fromRectangle;

  useNativeNavigationEvent('appear', () => {
    onReady();
  });

  const router = useRouter();
  const onBack = () => {
    router.back();
  };

  if (!data.user) {
    return null;
  }

  return shouldAnimate ? (
    <UserMobileScreenAppearAnimationWrapper
      user={data.user}
      viewer={data.viewer}
      ready={ready}
      onBack={onBack}
      params={params}
    />
  ) : (
    <UserScreen
      user={data.user}
      viewer={data.viewer}
      ready={ready}
      onBack={onBack}
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
      ... on User {
        userName
        card {
          cover {
            backgroundColor
            ...CoverLayout_cover
            pictures {
              source
              kind
            }
          }
        }
      }
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

const TRANSITION_DURATION = 220;

UserMobileScreen.getScreenOptions = ({
  fromRectangle,
}: UserRoute['params']): ScreenOptions | null => {
  if (!fromRectangle) {
    return null;
  }
  return {
    stackAnimation: 'custom',
    transitionDuration: TRANSITION_DURATION,
    customAnimationOnSwipe: true,
  };
};

export default relayScreen(UserMobileScreen, {
  query: getQuery,
  getVariables: ({ userName, userId }) => (userId ? { userId } : { userName }),
});

const UserMobileScreenAppearAnimationWrapper = ({
  user,
  viewer,
  ready,
  params,
  onBack: onBackProp,
}: {
  user: UserMobileScreenByIdQuery$data['user'];
  viewer: UserScreenFramgent_viewer$key;
  params: UserRoute['params'];
  ready: boolean;
  onBack(): void;
}) => {
  const onBackAnimationEnd = () => {
    if (coverRef.current) {
      const imageIndex = coverRef.current.getCurrentImageIndex();
      const videoTime = coverRef.current.getCurrentVideoTime();
      params.setOriginCoverState?.({ imageIndex, videoTime });
    }
    setTimeout(onBackProp);
  };

  const { progress: transitionProgress, onBack } = useScreenTransitionProgress(
    onBackAnimationEnd,
    TRANSITION_DURATION,
  );

  const [coverReady, setCoverReady] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const coverRef = useRef<CoverHandle>(null);

  const onCoverReadyForDisplay = () => {
    if (!coverReady) {
      setCoverReady(true);
      if (params.snapshotID) {
        clearShapshot(params.snapshotID);
      }
    }
  };

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const fromRectangle = params.fromRectangle ?? {
    x: 0,
    y: 0,
    width: windowWidth,
    height: windowHeight,
  };
  const containerStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(
      transitionProgress.value,
      [0, 1],
      [fromRectangle.width * 0.128, 0],
    ),
    top: interpolate(transitionProgress.value, [0, 1], [fromRectangle.y, 0]),
    left: interpolate(transitionProgress.value, [0, 1], [fromRectangle.x, 0]),
    width: interpolate(
      transitionProgress.value,
      [0, 1],
      [fromRectangle.width, windowWidth],
    ),
    height: interpolate(
      transitionProgress.value,
      [0, 1],
      [fromRectangle.height, windowHeight],
    ),
  }));

  const screenContainerSyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          transitionProgress.value,
          [0, 1],
          [(fromRectangle.width - windowWidth) / 2, 0],
        ),
      },
      {
        translateY: interpolate(
          transitionProgress.value,
          [0, 1],
          [
            ((windowHeight * fromRectangle.width) / windowWidth -
              windowHeight) /
              2,
            0,
          ],
        ),
      },
      {
        scale: interpolate(
          transitionProgress.value,
          [0, 1],
          [fromRectangle.width / windowWidth, 1],
        ),
      },
    ],
  }));

  const safeAreaInsets = useSafeAreaInsets();

  const { card, userName } = user ?? {};
  if (!card || !userName) {
    return null;
  }

  const { pictures } = card.cover;

  const selectedPicture = pictures[params.imageIndex ?? 0];

  let imageURI: string | null = null;
  if (selectedPicture.kind === 'picture') {
    const { uri, alternateURI } = queryMediaCache(
      selectedPicture.source,
      windowWidth,
    );
    imageURI = uri ?? alternateURI ?? null;
  }

  return (
    <Animated.View
      style={[{ position: 'absolute', overflow: 'hidden' }, containerStyle]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: windowWidth,
            height: windowHeight,
            backgroundColor: card.cover.backgroundColor,
          },
          screenContainerSyle,
        ]}
      >
        {ready && (
          <UserScreen
            coverRef={coverRef}
            user={user as any}
            viewer={viewer}
            ready
            onBack={onBack}
            initialImageIndex={params.imageIndex}
            initialVideoTime={params.videoTime}
            onCoverReadyForDisplay={onCoverReadyForDisplay}
          />
        )}
        {!coverReady && card && (
          <View style={StyleSheet.absoluteFill}>
            <CoverLayout
              width={windowWidth}
              userName={userName}
              cover={card.cover as any}
              hideBorderRadius
            >
              <View
                style={{
                  width: windowWidth,
                  height: windowWidth / COVER_RATIO,
                }}
              >
                {params.snapshotID && !imageReady && (
                  <SnapshotView
                    snapshotID={params.snapshotID}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                {imageURI && (
                  <Image
                    source={{ uri: imageURI }}
                    onLoad={() => setImageReady(true)}
                    style={[
                      StyleSheet.absoluteFill,
                      { opacity: imageReady ? 1 : 0 },
                    ]}
                  />
                )}
              </View>
            </CoverLayout>
            <FloatingIconButton
              icon="chevron"
              style={{
                position: 'absolute',
                start: 15,
                zIndex: 1,
                top: safeAreaInsets.top + 16,
              }}
              onPress={onBack}
            />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const useScreenTransitionProgress = (
  onBackAnimationEnd?: () => void,
  duration = 350,
) => {
  const { progress, closing, goingForward } = useReanimatedTransitionProgress();

  const isBackSharedValue = useSharedValue(false);
  const backAnimationSharedValue = useSharedValue(1);
  const isFirstMount = useSharedValue(true);
  const appearAnimationSharedValue = useDerivedValue(() => {
    const { value } = progress;
    if (isFirstMount.value) {
      return value;
    }
    const isClosing = closing.value === 1;
    const isGoingForward = goingForward.value === 1;
    if (isBackSharedValue.value) {
      return backAnimationSharedValue.value;
    } else if (
      (isClosing && isGoingForward) ||
      (!isClosing && !isGoingForward)
    ) {
      return 1;
    } else if (isClosing) {
      return 1 - value;
    }
    return value;
  });

  useNativeNavigationEvent('appear', () => {
    isFirstMount.value = false;
  });

  const onBackEnd = () => {
    setScreenOptions(options => ({ ...options, transitionDuration: 0 }));
    onBackAnimationEnd?.();
  };

  const onBack = () => {
    isBackSharedValue.value = true;
    backAnimationSharedValue.value = withTiming(0, { duration }, () => {
      runOnJS(onBackEnd)();
    });
  };

  const setScreenOptions = useScreenOptionsUpdater();

  return { progress: appearAnimationSharedValue, onBack };
};
