import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery, useRelayEnvironment } from 'react-relay';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { mainRoutes } from '#mobileRoutes';
import {
  useNativeNavigationEvent,
  useRouter,
  useScreenOptionsUpdater,
} from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import useAuthState from '#hooks/useAuthState';
import useToggle from '#hooks/useToggle';
import useToggleFollow from '#hooks/useToggleFollow';
import Container from '#ui/Container';
import CardFlipSwitch from './CardFlipSwitch';
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
  route: { params },
}: RelayScreenProps<
  ProfileRoute,
  ProfileScreenByIdQuery | ProfileScreenByUserNameQuery
>) => {
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);

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
  const onHome = () => {
    if (isViewer) router.back();
    else router.replaceAll(mainRoutes(false));
  };

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

  const [showPost, toggleFlip] = useToggle(params.showPosts ?? false);
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

  const setOptions = useScreenOptionsUpdater();
  useEffect(() => {
    const animation: ScreenOptions =
      showPost || !isAtTop
        ? ({ stackAnimation: 'slide_from_bottom' } as const)
        : animatedTransitionFactory(params);
    setOptions({
      gestureEnabled: !editing && !showPost,
      ...animation,
    });
  }, [setOptions, showPost, editing, params, isAtTop]);

  const onToggleFollow = useToggleFollow(auth.profileId);
  const ref = useRef<CardFlipSwitchRef>(null);

  if (!data.profile) {
    return null;
  }

  const isViewer = data.profile.id === auth.profileId;

  return (
    <>
      <Suspense>
        <ProfileBackground profile={data.profile} />
      </Suspense>
      <ProfileScreenTransitionsProvider
        editing={editing}
        selectionMode={selectionMode}
      >
        <View style={{ flex: 1 }}>
          <CardFlipSwitch
            ref={ref}
            style={{ flex: 1 }}
            flipped={showPost}
            disabled={editing}
            onFlip={toggleFlip}
            front={
              <Container style={{ flex: 1 }}>
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
              </Container>
            }
            back={
              <Suspense>
                <ProfilePostsList
                  isViewer={isViewer}
                  profile={data.profile}
                  hasFocus={showPost && ready}
                  userName={data.profile.userName!}
                />
              </Suspense>
            }
          />
          <ProfileScreenButtonBar
            profile={data.profile}
            isViewer={isViewer}
            editing={editing}
            onHome={onHome}
            isWebCardDisplayed={!showPost}
            onEdit={toggleEditing}
            onToggleFollow={onToggleFollow}
            onFlip={ref.current?.triggerFlip}
            onShowWebcardModal={onShowWebcardModal}
          />
        </View>
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
        />
      </Suspense>
    </>
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

export default relayScreen(ProfileScreen, {
  query: getQuery,
  getVariables: ({ userName, profileId }) =>
    profileId ? { profileId } : { userName },
});
