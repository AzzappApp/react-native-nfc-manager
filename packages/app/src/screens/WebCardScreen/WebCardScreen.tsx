import { fromGlobalId } from 'graphql-relay';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Dimensions, Platform, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import {
  useDidAppear,
  useRouter,
  useScreenOptionsUpdater,
} from '#components/NativeRouter';
import WebCardMenu from '#components/WebCardMenu';
import { logEvent } from '#helpers/analytics';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  profileInfoHasAdminRight,
  profileInfoHasEditorRight,
  profileInfoIsOwner,
} from '#helpers/profileRoleHelper';
import relayScreen from '#helpers/relayScreen';
import { useProfileInfos } from '#hooks/authStateHooks';
import useAnimatedState from '#hooks/useAnimatedState';
import useBoolean from '#hooks/useBoolean';
import {
  UPDATE_CONTACT_CARD_SCANS,
  useWebCardViewStatistic,
} from '#hooks/useStatistics';
import useToggleFollow from '#hooks/useToggleFollow';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Text from '#ui/Text';
import AddContactModal from './AddContactModal';
import WebCardBackground from './WebCardBackground';
import { useWebCardEditTransition } from './WebCardEditTransition';
import WebCardPostsList from './WebCardPostsList';
import WebCardScreenButtonBar from './WebCardScreenButtonBar';
import WebCardScreenContent from './WebCardScreenContent';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WebCardScreenByIdQuery } from '#relayArtifacts/WebCardScreenByIdQuery.graphql';
import type { WebCardScreenByUserNameQuery } from '#relayArtifacts/WebCardScreenByUserNameQuery.graphql';
import type { WebCardRoute } from '#routes';
/**
 * Display a Web card.
 */
export const WebCardScreen = ({
  preloadedQuery,
  hasFocus,
  route: { params },
}: RelayScreenProps<
  WebCardRoute,
  WebCardScreenByIdQuery | WebCardScreenByUserNameQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  const styles = useStyleSheet(styleSheet);

  useWebCardViewStatistic(params.webCardId ?? data.webCard?.id);

  const ready = useDidAppear();

  const router = useRouter();

  const profileInfos = useProfileInfos();
  const isViewer = profileInfos?.webCardId === data.webCard?.id;
  const isWebCardOwner = isViewer && profileInfoIsOwner(profileInfos);
  const canEdit = isViewer && profileInfoHasEditorRight(profileInfos);
  const isAdmin = isViewer && profileInfoHasAdminRight(profileInfos);

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

  //#region Edit
  const {
    editing,
    editTransition,
    transitionInfos,
    scrollViewRef,
    editScrollViewRef,
    toggleEditing,
  } = useWebCardEditTransition((canEdit && params.editing) ?? false);
  const onEdit = useCallback(() => {
    if (profileInfoHasEditorRight(profileInfos)) {
      toggleEditing();
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
  }, [intl, profileInfos, toggleEditing]);

  const onEditDone = useCallback(() => {
    toggleEditing();
  }, [toggleEditing]);
  //#endregion

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

  const [showPost, setShowPost] = useState(params.showPosts ?? false);
  const initialManualGesture = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!editing && Platform.OS === 'ios')
        .hitSlop({
          top: 0,
          bottom: 0,
          left: showPost ? 0 : -windowWidth / 2,
          right: 0,
        })
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
    [editing, initialManualGesture, manualFlip, showPost, windowWidth],
  );

  useAnimatedReaction(
    () => Math.round(Math.abs(flip.value + manualFlip.value)) % 2 === 1,
    (value, previous) => {
      if (value !== previous) {
        runOnJS(setShowPost)(value);
      }
    },
    [],
  );

  // #end region

  if (!data.webCard) {
    return (
      <View style={styles.deletedCaseContainer}>
        <Text variant="large">
          <FormattedMessage
            defaultMessage="This WebCard{azzappA} does not exist"
            description="Error message when the WebCard is not found"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <Button
          onPress={router.back}
          label={intl.formatMessage({
            defaultMessage: 'Go back',
            description: 'Button to go back to the previous screen',
          })}
        />
      </View>
    );
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
                editScrollViewRef={editScrollViewRef}
                scrollViewRef={scrollViewRef}
                canEdit={canEdit}
                fromCreation={!!params.fromCreation}
                editing={editing}
                editTransition={editTransition}
                onContentPositionChange={onContentPositionChange}
                onEditDone={onEditDone}
                transitionInfos={transitionInfos}
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
                />
              )}
            </Suspense>
          </Animated.View>
        </View>
      </GestureDetector>
      <WebCardScreenButtonBar
        webCard={data.webCard}
        isViewer={isViewer}
        onHome={router.backToTop}
        isWebCardDisplayed={!showPost}
        onEdit={onEdit}
        onToggleFollow={toggleFollow}
        onFlip={toggleFlip}
        onShowWebcardModal={onShowWebcardModal}
        editing={editing}
        editTransition={editTransition}
      />

      <AddContactModal webCard={data.webCard} params={params} />

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
    </View>
  );
};

const getQuery = (params: WebCardRoute['params']) =>
  params.webCardId ? webCardScreenByIdQuery : webCardScreenByNameQuery;

const webCardScreenByIdQuery = graphql`
  query WebCardScreenByIdQuery($webCardId: ID!, $viewerWebCardId: ID!) {
    webCard: node(id: $webCardId) {
      id
      ... on WebCard {
        userName
      }
      ...WebCardScreenContent_webCard
      ...WebCardScreenButtonBar_webCard
        @arguments(viewerWebCardId: $viewerWebCardId)
      ...WebCardBackground_webCard
      ...WebCardMenu_webCard @arguments(viewerWebCardId: $viewerWebCardId)
      ...AddContactModal_webCard
    }
  }
`;

const webCardScreenByNameQuery = graphql`
  query WebCardScreenByUserNameQuery(
    $userName: String!
    $viewerWebCardId: ID!
  ) {
    webCard(userName: $userName) {
      id
      userName
      ...WebCardScreenContent_webCard
      ...WebCardScreenButtonBar_webCard
        @arguments(viewerWebCardId: $viewerWebCardId)
      ...WebCardBackground_webCard
      ...WebCardMenu_webCard @arguments(viewerWebCardId: $viewerWebCardId)
      ...AddContactModal_webCard
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
        }
      : {
          userName,
          viewerWebCardId: profileInfos?.webCardId ?? '',
        },
  fetchPolicy: 'store-and-network',
});

const styleSheet = createStyleSheet(appearance => ({
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
  deletedCaseContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
}));
