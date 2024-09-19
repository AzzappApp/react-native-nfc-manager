import { fromGlobalId } from 'graphql-relay';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
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
import {
  graphql,
  useMutation,
  usePreloadedQuery,
  useRelayEnvironment,
} from 'react-relay';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import {
  profileHasEditorRight,
  profileIsOwner,
} from '@azzapp/shared/profileHelpers';
import {
  useDidAppear,
  useRouter,
  useScreenOptionsUpdater,
} from '#components/NativeRouter';
import { logEvent } from '#helpers/analytics';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import useAnimatedState from '#hooks/useAnimatedState';
import useAuthState from '#hooks/useAuthState';
import {
  UPDATE_CONTACT_CARD_SCANS,
  useWebCardViewStatistic,
} from '#hooks/useStatistics';
import useToggle from '#hooks/useToggle';
import useToggleFollow from '#hooks/useToggleFollow';
import Container from '#ui/Container';
import WebCardBackground from './WebCardBackground';
import WebCardModal from './WebCardModal';
import WebCardPostsList from './WebCardPostsList';
import WebCardScreenButtonBar from './WebCardScreenButtonBar';
import WebCardScreenContactDownloader from './WebCardScreenContactDownloader';
import WebCardScreenContent from './WebCardScreenContent';
import WebCardScreenPublishHelper from './WebCardScreenPublishHelper';
import { WebCardScreenTransitionsProvider } from './WebCardScreenTransitions';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WebCardScreenByIdQuery } from '#relayArtifacts/WebCardScreenByIdQuery.graphql';
import type { WebCardScreenByUserNameQuery } from '#relayArtifacts/WebCardScreenByUserNameQuery.graphql';
import type { WebCardRoute } from '#routes';
import type { CardFlipSwitchRef } from './CardFlipSwitch';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { Disposable } from 'react-relay';

/**
 * Display a Web card.
 */
const WebCardScreen = ({
  preloadedQuery,
  hasFocus,
  route: { params },
}: RelayScreenProps<
  WebCardRoute,
  WebCardScreenByIdQuery | WebCardScreenByUserNameQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);

  useWebCardViewStatistic(params.webCardId ?? data.webCard?.id);

  const ready = useDidAppear();

  useEffect(() => {
    dispatchGlobalEvent({ type: 'READY' });
  }, []);

  const router = useRouter();

  const prefetchRoute = usePrefetchRoute();

  const { profileInfos } = useAuthState();
  const isViewer = profileInfos?.webCardId === data.webCard?.id;
  const isWebCardOwner = isViewer && profileIsOwner(profileInfos?.profileRole);
  const canEdit = isViewer && profileHasEditorRight(profileInfos?.profileRole);

  const environment = useRelayEnvironment();

  const scannedContactCard = useRef<string | null>(null);

  // contact card scan
  const [commit] = useMutation(UPDATE_CONTACT_CARD_SCANS);

  useEffect(() => {
    if (params.contactData && data.webCard?.id) {
      const contactData = parseContactCard(params.contactData);

      if (
        contactData.webCardId === fromGlobalId(data.webCard?.id).id &&
        scannedContactCard.current !== contactData.profileId
      ) {
        scannedContactCard.current = contactData.profileId;
        // the profile is open from a scan contact card with the phone
        commit({
          variables: {
            input: {
              scannedProfileId: contactData?.profileId,
            },
          },
        });
      }
    }
  }, [commit, data.webCard?.id, params.contactData]);

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

  const intl = useIntl();

  const toggleFollow = useCallback(
    (webCardId: string, userName: string, follow: boolean) => {
      if (
        profileInfos?.profileRole &&
        profileHasEditorRight(profileInfos.profileRole)
      ) {
        onToggleFollow(webCardId, userName, follow);
      } else if (follow) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Your role does not permit this action',
            description: 'Error message when trying to follow a WebCard',
          }),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Your role does not permit this action',
            description: 'Error message when trying to unfollow a WebCard',
          }),
        });
      }
    },
    [intl, onToggleFollow, profileInfos?.profileRole],
  );

  const ref = useRef<CardFlipSwitchRef>(null);

  // #region Flip Animation
  //Restoring it in single file, "is" more performant on android
  const { width: windowWidth } = useWindowDimensions();
  const cardRadius = COVER_CARD_RADIUS * windowWidth;

  const toggleFlip = useCallback(() => {
    setPositionFlip(prev => {
      if (prev % 2 === 0) {
        logEvent('webcard_flip_to_post');
      }
      return prev + 1;
    });
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
    if (profileHasEditorRight(profileInfos?.profileRole)) {
      if (!ref.current?.animationRunning.value) {
        toggleEditing();
      }
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to edit the WebCard without being an admin',
        }),
      });
    }
  }, [profileInfos?.profileRole, toggleEditing, intl]);

  // const viewerWebCardUnpublish =
  //   profileInfos?.webCardId !== data.webCard?.id &&
  //   data.node?.viewerWebCard?.cardIsPublished === false;
  // const displayAlertUnpublished = useCallback(() => {
  //   Alert.alert(
  //     intl.formatMessage({
  //       defaultMessage: 'Unpublished WebCard.',
  //       description:
  //         'PostList - Alert Message title when the user is viewing a post (from deeplinking) with an unpublished WebCard',
  //     }),
  //     intl.formatMessage({
  //       defaultMessage:
  //         'This action can only be done from a published WebCard.',
  //       description:
  //         'PostList - AlertMessage when the user is viewing a post (from deeplinking) with an unpublished WebCard',
  //     }),
  //     [
  //       {
  //         text: intl.formatMessage({
  //           defaultMessage: 'Ok',
  //           description:
  //             'PostList - Alert button when the user is viewing a post (from deeplinking) with an unpublished WebCard',
  //         }),
  //         onPress: () => {
  //           router.back();
  //         },
  //       },
  //     ],
  //   );
  // }, [intl, router]);

  if (!data.webCard || !data.profile?.webCard) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Suspense>
        <WebCardBackground webCard={data.webCard} />
      </Suspense>
      <WebCardScreenTransitionsProvider
        editing={editing}
        selectionMode={selectionMode}
      >
        <GestureDetector gesture={pan}>
          <View style={styles.container}>
            <Animated.View
              style={[styles.front, borderRadiusStyle, frontStyle]}
            >
              <Container style={styles.container}>
                <WebCardScreenContent
                  ready={ready}
                  webCard={data.webCard}
                  editing={editing}
                  isViewer={isViewer}
                  selectionMode={selectionMode}
                  onToggleEditing={toggleEditing}
                  onToggleSelectionMode={toggleSelectionMode}
                  onContentPositionChange={onContentPositionChange}
                />
              </Container>
            </Animated.View>
            <Animated.View
              style={[styles.back, borderRadiusStyle, backStyle]}
              pointerEvents={showPost ? 'box-none' : 'none'}
            >
              <Suspense>
                <WebCardPostsList
                  toggleFlip={toggleFlip}
                  isViewer={isViewer}
                  webCardId={data.webCard.id}
                  hasFocus={hasFocus && showPost && ready}
                  userName={data.webCard.userName!}
                  viewerWebCard={data.profile.webCard}
                />
              </Suspense>
            </Animated.View>
          </View>
        </GestureDetector>
        <WebCardScreenButtonBar
          webCard={data.webCard}
          profile={data.profile}
          isViewer={isViewer}
          editing={editing}
          onHome={router.backToTop}
          isWebCardDisplayed={!showPost}
          onEdit={onEdit}
          onToggleFollow={toggleFollow}
          onFlip={toggleFlip}
          onShowWebcardModal={onShowWebcardModal}
        />
      </WebCardScreenTransitionsProvider>
      <WebCardScreenContactDownloader
        userName={data.webCard.userName}
        webCard={data.webCard}
        contactData={params.contactData}
        additionalContactData={params.additionalContactData}
      />
      <Suspense fallback={null}>
        <WebCardScreenPublishHelper webCard={data.webCard} editMode={editing} />
        <WebCardModal
          visible={showWebcardModal}
          webCard={data.webCard}
          close={toggleWebcardModal}
          onToggleFollow={toggleFollow}
          isViewer={isViewer}
          isOwner={isWebCardOwner}
        />
      </Suspense>
    </View>
  );
};

const getQuery = (params: WebCardRoute['params']) =>
  params.webCardId ? webCardScreenByIdQuery : webCardScreenByNameQuery;

const webCardScreenByIdQuery = graphql`
  query WebCardScreenByIdQuery(
    $webCardId: ID!
    $viewerWebCardId: ID!
    $profileId: ID!
  ) {
    webCard: node(id: $webCardId) {
      id
      ... on WebCard {
        userName
      }
      ...WebCardScreenContent_webCard
      ...WebCardScreenButtonBar_webCard
        @arguments(viewerWebCardId: $viewerWebCardId)
      ...WebCardScreenPublishHelper_webCard
      ...WebCardBackground_webCard
      ...WebCardModal_webCard @arguments(viewerWebCardId: $viewerWebCardId)
    }
    profile: node(id: $profileId) {
      ... on Profile {
        ...WebCardScreenButtonBar_profile
        webCard {
          ...PostList_viewerWebCard
        }
        invited
      }
    }
  }
`;

const webCardScreenByNameQuery = graphql`
  query WebCardScreenByUserNameQuery(
    $userName: String!
    $viewerWebCardId: ID!
    $profileId: ID!
  ) {
    webCard(userName: $userName) {
      id
      userName
      ...WebCardScreenContent_webCard
      ...WebCardScreenButtonBar_webCard
        @arguments(viewerWebCardId: $viewerWebCardId)
      ...WebCardScreenPublishHelper_webCard
      ...WebCardBackground_webCard
      ...WebCardModal_webCard @arguments(viewerWebCardId: $viewerWebCardId)
    }
    profile: node(id: $profileId) {
      ... on Profile {
        ...WebCardScreenButtonBar_profile
        webCard {
          ...PostList_viewerWebCard
        }
        invited
      }
    }
  }
`;

const animatedTransitionFactory = ({
  fromRectangle,
  showPosts,
}: WebCardRoute['params']): ScreenOptions => {
  if (Platform.OS !== 'ios' || !fromRectangle || showPosts) {
    return { stackAnimation: 'slide_from_bottom', replaceAnimation: 'push' };
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

WebCardScreen.getScreenOptions = animatedTransitionFactory;

const backRotationTargetInterpolation =
  Platform.OS === 'ios'
    ? [0, -Math.PI, -2 * Math.PI]
    : [0, Math.PI, 2 * Math.PI];

export default relayScreen(WebCardScreen, {
  query: getQuery,
  getVariables: ({ userName, webCardId }, profileInfos) =>
    webCardId
      ? {
          webCardId,
          viewerWebCardId: profileInfos?.webCardId ?? '',
          profileId: profileInfos?.profileId,
        }
      : {
          userName,
          viewerWebCardId: profileInfos?.webCardId ?? '',
          profileId: profileInfos?.profileId,
        },
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
