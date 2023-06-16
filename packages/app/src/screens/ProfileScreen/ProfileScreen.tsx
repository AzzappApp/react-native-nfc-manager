import { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { useNativeNavigationEvent, useRouter } from '#components/NativeRouter';
import { ProfilePostsList } from '#components/PostList';
import relayScreen from '#helpers/relayScreen';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import useToggle from '#hooks/useToggle';
import useToggleFollow from '#hooks/useToggleFollow';
import ProfileScreenButtonBar from './ProfileScreenButtonBar';
import ProfileScreenContent from './ProfileScreenContent';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ProfileRoute } from '#routes';
import type { ProfileScreenByIdQuery } from '@azzapp/relay/artifacts/ProfileScreenByIdQuery.graphql';
import type { ProfileScreenByUserNameQuery } from '@azzapp/relay/artifacts/ProfileScreenByUserNameQuery.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

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
  const { bottom } = useSafeAreaInsets();
  const data = usePreloadedQuery(getQuery(params), preloadedQuery);
  const [ready, setReady] = useState(false);
  useNativeNavigationEvent('appear', () => {
    setReady(true);
  });
  const router = useRouter();
  const onHome = () => {
    router.backToTop();
  };

  const prefetchRoute = usePrefetchRoute();
  useEffect(() => {
    const { viewer, profile } = data;
    if (
      viewer?.profile?.id &&
      profile?.id &&
      viewer.profile.id === profile.id
    ) {
      const modules: Array<ModuleKind | 'cover'> = ['cover', ...MODULE_KINDS];
      modules.forEach(module => {
        prefetchRoute({
          route: 'CARD_MODULE_EDITION',
          params: { module },
        });
      });
    }
  }, [data, prefetchRoute]);

  const [showPost, toggleFlip] = useToggle(false);
  const transition = useDerivedValue(() => {
    return withTiming(showPost ? 1 : 0, {
      duration: 1300,
      easing: Easing.out(Easing.back(1)),
    });
  });

  const frontStyle = useAnimatedStyle(() => {
    const flipVal = !showPost
      ? interpolate(transition.value, [0, 1], [0, 180])
      : interpolate(transition.value, [1, 0], [180, 360]);

    const scale = interpolate(transition.value, [0, 0.5, 1], [1, 0.7, 1]);
    return {
      borderRadius: 40,
      overflow: 'hidden',
      opacity: interpolate(transition.value, [0, 1], [1, 0]),
      transform: [
        { perspective: 900 },
        {
          rotateY: `${flipVal}deg`,
        },
        {
          scale,
        },
      ],
    };
  }, [transition.value, showPost]);

  const backStyle = useAnimatedStyle(() => {
    const flipVal = !showPost
      ? interpolate(transition.value, [0, 1], [180, 360])
      : interpolate(transition.value, [1, 0], [0, 180]);
    const scale = interpolate(transition.value, [0, 0.5, 1], [1, 0.7, 1]);
    return {
      opacity: interpolate(transition.value, [0, 1], [0, 1]),
      borderRadius: 40,
      overflow: 'hidden',
      transform: [
        { perspective: 900 },
        { rotateY: `${flipVal}deg` },
        {
          scale,
        },
      ],
    };
  }, [transition.value, showPost]);

  const [editMode, toggleEditMode] = useToggle(false);
  const editModeTransition = useDerivedValue(() => {
    return withTiming(editMode ? 1 : 0, {
      duration: 300,
    });
  });

  const buttonBarStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        editModeTransition.value,
        [0, 0.2, 0.8, 1],
        [1, 0.1, 0.0, 0],
      ),
    };
  }, [editModeTransition.value]);

  const onToggleFollow = useToggleFollow(data.viewer?.profile?.id);

  if (!data.profile) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={[styles.front, frontStyle]}
        pointerEvents={showPost ? 'none' : 'box-none'}
      >
        <ProfileScreenContent
          ready={ready}
          profile={data.profile}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
        />
      </Animated.View>
      <Animated.View
        style={[styles.back, backStyle]}
        pointerEvents={showPost ? 'box-none' : 'none'}
      >
        <ProfilePostsList hasFocus={showPost} profile={data.profile} />
      </Animated.View>
      <Animated.View
        style={[styles.buttonBar, { bottom }, buttonBarStyle]}
        pointerEvents={editMode ? 'none' : 'box-none'}
      >
        <ProfileScreenButtonBar
          userName={data.profile.userName!}
          onHome={onHome}
          isWebCardDisplayed={!showPost}
          onEdit={toggleEditMode}
          onToggleFollow={follow => onToggleFollow(data.profile!.id, follow)}
          onFlip={toggleFlip}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  front: {
    height: '100%',
    width: '100%',
    backgroundColor: '#D8D9CF',
    borderRadius: 16,
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },
  back: {
    flex: 1,
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    width: '100%',
    paddingHorizontal: 15,
    zIndex: 999,
  },
  mainButton: {
    flex: 1,
    marginLeft: 15,
  },
  mainButtonFallback: {
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  userPostsButton: {
    marginLeft: 15,
  },
});

const getQuery = (params: ProfileRoute['params']) =>
  params.profileID ? profileScreenByIdQuery : profileScreenByNameQuery;

const profileScreenByIdQuery = graphql`
  query ProfileScreenByIdQuery($profileID: ID!) {
    profile: node(id: $profileID) {
      id
      ... on Profile {
        isViewer
        userName
      }
      ...ProfileScreenContent_profile
      ...ProfilePostsListFragment_posts
      ...PostRendererFragment_author
      ...ProfilePostsListFragment_author
    }
    viewer {
      profile {
        id
        userName
      }
    }
  }
`;

const profileScreenByNameQuery = graphql`
  query ProfileScreenByUserNameQuery($userName: String!) {
    profile(userName: $userName) {
      id
      isViewer
      userName
      ...ProfileScreenContent_profile
      ...ProfilePostsListFragment_posts
      ...PostRendererFragment_author
      ...ProfilePostsListFragment_author
    }
    viewer {
      profile {
        id
      }
    }
  }
`;

ProfileScreen.getScreenOptions = ({
  fromRectangle,
}: ProfileRoute['params']): ScreenOptions | null => {
  if (Platform.OS !== 'ios') {
    // TODO make it works on android
    return { stackAnimation: 'default' };
  }
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

export default relayScreen(ProfileScreen, {
  query: getQuery,
  getVariables: ({ userName, profileID }) =>
    profileID ? { profileID } : { userName },
});
