import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Platform,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery, useRelayEnvironment } from 'react-relay';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import {
  useNativeNavigationEvent,
  useRouter,
  useScreenOptionsUpdater,
} from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import useAnimatedState from '#hooks/useAnimatedState';
import useAuthState from '#hooks/useAuthState';
import { useWebcardViewStatistic } from '#hooks/useStatistics';
import useToggle from '#hooks/useToggle';
import useToggleFollow from '#hooks/useToggleFollow';
import Container from '#ui/Container';
import ProfileBackground from './ProfileBackground';
import ProfilePostsList from './ProfilePostsList';
import ProfileScreenButtonBar from './ProfileScreenButtonBar';
import ProfileScreenContactDownloader from './ProfileScreenContactDownloader';
import ProfileScreenContent from './ProfileScreenContent';
import ProfileScreenPublishHelper from './ProfileScreenPublishHelper';
import { ProfileScreenTransitionsProvider } from './ProfileScreenTransitions';
import ProfileWebCardModal from './ProfileWebcardModal';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ProfileRoute } from '#routes';
import type { CardFlipSwitchRef } from './CardFlipSwitch';
import type { ProfileScreenByIdQuery } from '@azzapp/relay/artifacts/ProfileScreenByIdQuery.graphql';
import type { ProfileScreenByUserNameQuery } from '@azzapp/relay/artifacts/ProfileScreenByUserNameQuery.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { Disposable } from 'react-relay';

/**
 * Display a profile Web card.
 */
const ProfileScreen = ({
  preloadedQuery,
  hasFocus,
  route: { params },
}: RelayScreenProps<
  ProfileRoute,
  ProfileScreenByIdQuery | ProfileScreenByUserNameQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  useWebcardViewStatistic(params.profileId ?? data.profile?.id);
  const [ready, setReady] = useState(false);
  useNativeNavigationEvent('appear', () => {
    setReady(true);
  });

  useEffect(() => {
    if (ready) {
      dispatchGlobalEvent({ type: 'READY' });
    }
  }, [ready]);

  const router = useRouter();

  const prefetchRoute = usePrefetchRoute();

  const auth = useAuthState();
  const canEdit = auth && auth.profileId === data.profile?.id;

  const environment = useRelayEnvironment();
  useEffect(() => {
    let disposables: Disposable[];
    if (canEdit) {
      const modules: ModuleKind[] = [...MODULE_KINDS];
      disposables = [
        prefetchRoute(environment, {
          route: 'COVER_EDITION',
        }),
        ...modules.map(module =>
          prefetchRoute(environment, {
            route: 'CARD_MODULE_EDITION',
            params: { module },
          }),
        ),
      ];
    }
    return () => {
      disposables?.forEach(disposable => disposable.dispose());
    };
  }, [prefetchRoute, canEdit, environment]);

  const [editing, toggleEditing] = useToggle(canEdit && params.editing);
  const [selectionMode, toggleSelectionMode] = useToggle(false);
  const [showWebcardModal, toggleWebcardModal] = useToggle(false);

  const onShowWebcardModal = useCallback(() => {
    Toast.hide();
    toggleWebcardModal();
  }, [toggleWebcardModal]);

  const [isAtTop, setIsAtTop] = useState(true);
  const onContentPositionChange = useCallback((atTop: boolean) => {
    setIsAtTop(atTop);
  }, []);
  const [positionFlip, setPositionFlip] = useState(params.showPosts ? 1 : 0);
  const setOptions = useScreenOptionsUpdater();
  useEffect(() => {
    const animation: ScreenOptions =
      positionFlip === 1 || !isAtTop
        ? ({ stackAnimation: 'slide_from_bottom' } as const)
        : animatedTransitionFactory(params);
    setOptions({
      gestureEnabled: !editing && positionFlip !== 1,
      ...animation,
    });
  }, [setOptions, positionFlip, editing, params, isAtTop]);

  const onToggleFollow = useToggleFollow();
  const ref = useRef<CardFlipSwitchRef>(null);

  // #region Flip Animation
  //Restoring it in single file, "is" more performant on android
  const { width: windowWidth } = useWindowDimensions();
  const cardRadius = COVER_CARD_RADIUS * windowWidth;

  const toggleFlip = useCallback(() => {
    setPositionFlip(prev => prev + 1);
  }, []);

  const manualFlip = useSharedValue(0);
  const flip = useAnimatedState(positionFlip, {
    duration: 1300,
    easing: Easing.out(Easing.back(1)),
  });

  const borderRadiusStyle = useAnimatedStyle(
    () => ({
      borderRadius: interpolate(
        Math.abs(flip.value + manualFlip.value) % 1,
        [0, 0.1, 0.9, 1],
        [0, cardRadius, cardRadius, 0],
      ),
    }),
    [flip, manualFlip],
  );

  const frontStyle = useAnimatedStyle(
    () => ({
      transform: [
        { perspective: 900 },
        {
          rotateY: `${interpolate(
            (flip.value + manualFlip.value) % 2,
            [0, 1, 2],
            [0, Math.PI, 2 * Math.PI],
          )}rad`,
        },
        {
          scale: interpolate(
            Math.abs(flip.value + manualFlip.value) % 1,
            [0, 0.5, 1],
            [1, 0.7, 1],
          ),
        },
      ],
    }),
    [flip, manualFlip],
  );

  const backStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: -900 },
        {
          rotateY: `${interpolate(
            (flip.value + manualFlip.value - 1) % 2,
            [0, 1, 2],
            backRotationTargetInterpolation,
          )}rad`,
        },
        {
          scale: interpolate(
            Math.abs(flip.value + manualFlip.value) % 1,
            [0, 0.5, 1],
            [1, 0.7, 1],
          ),
        },
      ],
    };
  }, [flip, manualFlip]);

  const initialManualGesture = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10]) //help the postlist scroll to work on Android
        .enabled(!editing)
        .onStart(() => {
          initialManualGesture.value = manualFlip.value;
        })
        .onChange(e => {
          manualFlip.value += e.changeX / windowWidth;
        })
        .onEnd(e => {
          const decimal = e.translationX / windowWidth;
          const duration = 1300 * (1 - Math.abs(decimal));
          const nextPoint = Math.round(initialManualGesture.value + decimal);
          const timingParam = { duration, easing: Easing.out(Easing.back(1)) };

          if (Math.abs(decimal) >= 0.32 && Math.abs(decimal) < 0.5) {
            manualFlip.value = withTiming(
              nextPoint + (e.translationX < 0 ? -1 : 1),
              timingParam,
            );
          }
          // Add a fling behaviour. check velocity to force go to next
          else if (Math.abs(e.velocityX) > 400 && Math.abs(decimal) < 0.5) {
            //improving hte feeling by simulating a fling
            manualFlip.value = withTiming(
              nextPoint + (e.velocityX < 0 ? -1 : 1),
              timingParam,
            );
          } else {
            manualFlip.value = withTiming(nextPoint, {
              duration,
            });
          }
        }),
    [editing, initialManualGesture, manualFlip, windowWidth],
  );
  const [showPost, setShowPost] = useState(params.showPosts ?? false);

  useDerivedValue(() => {
    const res = Math.round(Math.abs(flip.value + manualFlip.value)) % 2 === 1;
    runOnJS(setShowPost)(res);
  }, [manualFlip, flip]);

  // #end region

  const onEdit = useCallback(() => {
    if (!ref.current?.animationRunning.value) {
      toggleEditing();
    }
  }, [toggleEditing]);

  if (!data.profile) {
    return null;
  }

  const isViewer = data.profile.id === auth.profileId;

  return (
    <View style={styles.container}>
      <Suspense>
        <ProfileBackground profile={data.profile} />
      </Suspense>
      <ProfileScreenTransitionsProvider
        editing={editing}
        selectionMode={selectionMode}
      >
        <GestureDetector gesture={pan}>
          <Container style={styles.container}>
            <Animated.View
              style={[styles.front, borderRadiusStyle, frontStyle]}
            >
              <ProfileScreenContent
                ready={ready}
                profile={data.profile}
                editing={editing}
                isViewer={isViewer}
                selectionMode={selectionMode}
                onToggleEditing={toggleEditing}
                onToggleSelectionMode={toggleSelectionMode}
                onContentPositionChange={onContentPositionChange}
              />
            </Animated.View>
            <Animated.View
              style={[styles.back, borderRadiusStyle, backStyle]}
              pointerEvents={showPost ? 'box-none' : 'none'}
            >
              <Suspense>
                <ProfilePostsList
                  isViewer={isViewer}
                  profile={data.profile}
                  hasFocus={hasFocus && showPost && ready}
                  userName={data.profile.userName!}
                />
              </Suspense>
            </Animated.View>
          </Container>
        </GestureDetector>
        <ProfileScreenButtonBar
          profile={data.profile}
          isViewer={isViewer}
          editing={editing}
          onHome={router.backToTop}
          isWebCardDisplayed={!showPost}
          onEdit={onEdit}
          onToggleFollow={onToggleFollow}
          onFlip={toggleFlip}
          onShowWebcardModal={onShowWebcardModal}
        />
      </ProfileScreenTransitionsProvider>
      <ProfileScreenContactDownloader
        profile={data.profile}
        contactData={params.contactData}
      />
      <Suspense fallback={null}>
        <ProfileScreenPublishHelper profile={data.profile} editMode={editing} />
        <ProfileWebCardModal
          visible={showWebcardModal}
          profile={data.profile}
          close={toggleWebcardModal}
          onToggleFollow={onToggleFollow}
          isViewer={isViewer}
        />
      </Suspense>
    </View>
  );
};

const getQuery = (params: ProfileRoute['params']) =>
  params.profileId ? profileScreenByIdQuery : profileScreenByNameQuery;

const profileScreenByIdQuery = graphql`
  query ProfileScreenByIdQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      id
      ... on Profile {
        userName
      }
      ...ProfileScreenContent_profile
      ...ProfilePostsList_profile
      ...PostRendererFragment_author
      ...ProfileScreenButtonBar_profile
      ...ProfileScreenPublishHelper_profile
      ...ProfileBackground_profile
      ...ProfileWebcardModal_profile
    }
  }
`;

const profileScreenByNameQuery = graphql`
  query ProfileScreenByUserNameQuery($userName: String!) {
    profile(userName: $userName) {
      id
      userName
      ...ProfileScreenContent_profile
      ...ProfilePostsList_profile
      ...PostRendererFragment_author
      ...ProfileScreenButtonBar_profile
      ...ProfileScreenPublishHelper_profile
      ...ProfileBackground_profile
      ...ProfileWebcardModal_profile
    }
  }
`;

const animatedTransitionFactory = ({
  fromRectangle,
  showPosts,
}: ProfileRoute['params']): ScreenOptions => {
  if (Platform.OS !== 'ios' || !fromRectangle || showPosts) {
    return { stackAnimation: 'slide_from_bottom' };
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

ProfileScreen.getScreenOptions = animatedTransitionFactory;

const backRotationTargetInterpolation =
  Platform.OS === 'ios'
    ? [0, -Math.PI, -2 * Math.PI]
    : [0, Math.PI, 2 * Math.PI];

export default relayScreen(ProfileScreen, {
  query: getQuery,
  getVariables: ({ userName, profileId }) =>
    profileId ? { profileId } : { userName },
  fetchPolicy: 'store-and-network',
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  front: {
    flex: 1,
    height: '100%',
    width: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  back: {
    height: '100%',
    width: '100%',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
});
