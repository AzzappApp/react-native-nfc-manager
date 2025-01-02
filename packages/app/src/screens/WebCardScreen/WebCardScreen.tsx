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
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import {
  useDidAppear,
  useRouter,
  useScreenOptionsUpdater,
} from '#components/NativeRouter';
import WebCardMenu from '#components/WebCardMenu';
import { logEvent } from '#helpers/analytics';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import {
  profileInfoHasAdminRight,
  profileInfoHasEditorRight,
  profileInfoIsOwner,
} from '#helpers/profileRoleHelper';
import relayScreen from '#helpers/relayScreen';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import { useProfileInfos } from '#hooks/authStateHooks';
import useAnimatedState from '#hooks/useAnimatedState';
import useBoolean from '#hooks/useBoolean';
import {
  UPDATE_CONTACT_CARD_SCANS,
  useWebCardViewStatistic,
} from '#hooks/useStatistics';
import useToggleFollow from '#hooks/useToggleFollow';
import Container from '#ui/Container';
import AddContactModal from './AddContactModal';
import WebCardBackground from './WebCardBackground';
import WebCardPostsList from './WebCardPostsList';
import WebCardScreenButtonBar from './WebCardScreenButtonBar';
import WebCardScreenContent from './WebCardScreenContent';
import WebCardScreenPublishHelper from './WebCardScreenPublishHelper';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WebCardScreenByIdQuery } from '#relayArtifacts/WebCardScreenByIdQuery.graphql';
import type { WebCardScreenByUserNameQuery } from '#relayArtifacts/WebCardScreenByUserNameQuery.graphql';
import type { WebCardRoute } from '#routes';
import type { ChildPositionAwareScrollViewHandle } from '#ui/ChildPositionAwareScrollView';
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

  const profileInfos = useProfileInfos();
  const isViewer = profileInfos?.webCardId === data.webCard?.id;
  const isWebCardOwner = isViewer && profileInfoIsOwner(profileInfos);
  const canEdit = isViewer && profileInfoHasEditorRight(profileInfos);
  const isAdmin = isViewer && profileInfoHasAdminRight(profileInfos);

  const prefetchRoute = usePrefetchRoute();
  const environment = useRelayEnvironment();
  useEffect(() => {
    if (!data.webCard?.id || !canEdit) {
      return () => {};
    }
    const disposable: Disposable = prefetchRoute(environment, {
      route: 'WEBCARD_EDIT',
      params: { webCardId: data.webCard.id },
    });

    return () => {
      disposable.dispose();
    };
  }, [prefetchRoute, canEdit, environment, data.webCard?.id]);

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

  const [showWebcardModal, openWebcardModal, closeWebcardModal] =
    useBoolean(false);

  const onShowWebcardModal = useCallback(() => {
    Toast.hide();
    openWebcardModal();
  }, [openWebcardModal]);

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
      gestureEnabled: positionFlip !== 1,
      ...animation,
    });
  }, [setOptions, positionFlip, params, isAtTop]);

  const onToggleFollow = useToggleFollow();

  const intl = useIntl();

  const toggleFollow = useCallback(
    (webCardId: string, userName: string, follow: boolean) => {
      if (profileInfoHasEditorRight(profileInfos)) {
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
    [intl, onToggleFollow, profileInfos],
  );

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

  const borderRadiusStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(
      Math.abs(flip.value + manualFlip.value) % 1,
      [0, 0.1, 0.9, 1],
      [0, cardRadius, cardRadius, 0],
    ),
  }));

  const frontStyle = useAnimatedStyle(() => ({
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
  }));

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
  });

  const initialManualGesture = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10]) //help the postlist scroll to work on Android
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
    [initialManualGesture, manualFlip, windowWidth],
  );
  const [showPost, setShowPost] = useState(params.showPosts ?? false);

  useDerivedValue(() => {
    const res = Math.round(Math.abs(flip.value + manualFlip.value)) % 2 === 1;
    runOnJS(setShowPost)(res);
  }, [manualFlip, flip]);

  const scrollViewRef = useRef<ChildPositionAwareScrollViewHandle>(null);

  const scrollPosition = params.scrollPosition;
  useEffect(() => {
    let timeout: any;
    if (scrollPosition) {
      timeout = setTimeout(() => {
        scrollViewRef.current?.scrollToChild({
          childId: scrollPosition.moduleId,
          y: scrollPosition.y,
          animated: false,
        });
      }, 100);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [scrollPosition]);

  // #end region

  const onEdit = useCallback(async () => {
    if (profileInfoHasEditorRight(profileInfos)) {
      if (!data.webCard?.id) {
        return;
      }
      const scrollPosition = await scrollViewRef.current?.getScrollPosition();
      router.push({
        route: 'WEBCARD_EDIT',
        params: {
          webCardId: data.webCard.id,
          fromCreation: false,
          scrollPosition: scrollPosition
            ? {
                moduleId: scrollPosition.childId,
                y: scrollPosition.y,
              }
            : null,
        },
      });
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
  }, [profileInfos, router, data.webCard?.id, intl]);

  if (!data.webCard || !data.profile?.webCard) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Suspense>
        <WebCardBackground webCard={data.webCard} />
      </Suspense>
      <GestureDetector gesture={pan}>
        <View style={styles.container}>
          <Animated.View style={[styles.front, borderRadiusStyle, frontStyle]}>
            <Container style={styles.container}>
              <WebCardScreenContent
                ready={ready}
                webCard={data.webCard}
                onContentPositionChange={onContentPositionChange}
                scrollViewRef={scrollViewRef}
              />
            </Container>
          </Animated.View>
          <Animated.View
            style={[styles.back, borderRadiusStyle, backStyle]}
            pointerEvents={showPost ? 'box-none' : 'none'}
          >
            <Suspense>
              {(showPost || ready) && (
                <WebCardPostsList
                  toggleFlip={toggleFlip}
                  isViewer={isViewer}
                  webCardId={data.webCard.id}
                  hasFocus={hasFocus && showPost && ready}
                  userName={data.webCard.userName!}
                  viewerWebCard={data.profile.webCard}
                />
              )}
            </Suspense>
          </Animated.View>
        </View>
      </GestureDetector>
      <WebCardScreenButtonBar
        webCard={data.webCard}
        profile={data.profile}
        isViewer={isViewer}
        onHome={router.backToTop}
        isWebCardDisplayed={!showPost}
        onEdit={onEdit}
        onToggleFollow={toggleFollow}
        onFlip={toggleFlip}
        onShowWebcardModal={onShowWebcardModal}
      />
      <Suspense>
        <AddContactModal
          user={data.currentUser!}
          webCard={data.webCard}
          contactData={params.contactData}
          additionalContactData={params.additionalContactData}
        />
      </Suspense>
      <Suspense fallback={null}>
        <WebCardMenu
          visible={showWebcardModal}
          webCard={data.webCard}
          close={closeWebcardModal}
          onToggleFollow={toggleFollow}
          isViewer={isViewer}
          isOwner={isWebCardOwner}
          isAdmin={isAdmin}
        />
      </Suspense>
      <Suspense>
        <WebCardScreenPublishHelper
          webCard={data.webCard}
          hasEdited={!!params.fromEditing}
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
      ...WebCardMenu_webCard @arguments(viewerWebCardId: $viewerWebCardId)
      ...WebCardScreenPublishHelper_webCard
      ...AddContactModal_webCard
    }
    profile: node(id: $profileId) {
      ... on Profile {
        ...WebCardScreenButtonBar_profile
        webCard {
          ...PostList_viewerWebCard
        }
      }
    }
    currentUser {
      ...AddContactModalProfiles_user
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
      ...WebCardMenu_webCard @arguments(viewerWebCardId: $viewerWebCardId)
      ...WebCardScreenPublishHelper_webCard
      ...AddContactModal_webCard
    }
    profile: node(id: $profileId) {
      ... on Profile {
        ...WebCardScreenButtonBar_profile
        webCard {
          ...PostList_viewerWebCard
        }
      }
    }
    currentUser {
      ...AddContactModalProfiles_user
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
