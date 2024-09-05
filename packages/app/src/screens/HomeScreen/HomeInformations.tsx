import { memo, useCallback, useEffect, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  useAnimatedReaction,
  interpolate,
  useSharedValue,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors } from '#theme';
import AnimatedText from '#components/AnimatedText';
import { useRouter } from '#components/NativeRouter';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeInformations_user$key } from '#relayArtifacts/HomeInformations_user.graphql';
type HomeInformationsProps = {
  user: HomeInformations_user$key;
  height: number;
};
/**
 *
 *
 * @param {HomeInformationsProps} {
 *   user,
 *   currentProfileIndexSharedValue,
 * }
 * @return {*}
 */
const HomeInformations = ({ height, user }: HomeInformationsProps) => {
  const { profiles } = useFragment(
    graphql`
      fragment HomeInformations_user on User {
        profiles {
          id
          webCard {
            id
            userName
            firstName
            nbPosts
            nbFollowings
            nbFollowers
            nbPostsLiked
          }
        }
      }
    `,
    user,
  );

  const nbLikesValue = useMemo(
    () =>
      [
        0,
        ...(profiles?.map(({ webCard }) => webCard?.nbPostsLiked ?? 0) ?? []),
      ] ?? [0],
    [profiles],
  );
  const nbFollowersValue = useMemo(
    () =>
      [
        0,
        ...(profiles?.map(({ webCard }) => webCard?.nbFollowers ?? 0) ?? []),
      ] ?? [0],
    [profiles],
  );

  const nbFollowingsValue = useMemo(
    () =>
      [
        0,
        ...(profiles?.map(({ webCard }) => webCard?.nbFollowings ?? 0) ?? []),
      ] ?? [0],
    [profiles],
  );

  const nbPostsValue = useMemo(
    () =>
      [0, ...(profiles?.map(({ webCard }) => webCard?.nbPosts ?? 0) ?? [])] ?? [
        0,
      ],
    [profiles],
  );

  const nbPosts = useSharedValue('-1');
  const nbLikes = useSharedValue('-1');
  const nbFollowers = useSharedValue('-1');
  const nbFollowings = useSharedValue('-1');

  const { currentIndexSharedValue, currentIndexProfile, inputRange } =
    useHomeScreenContext();
  //using profiles object directly in animatedReaction causes error animatedHost(seems to be the case for all relay query result)
  useEffect(() => {
    nbPosts.value = format(nbPostsValue[currentIndexProfile.value]);
    nbLikes.value = format(nbLikesValue[currentIndexProfile.value]);
    nbFollowings.value = format(nbFollowingsValue[currentIndexProfile.value]);
    nbFollowers.value = format(nbFollowersValue[currentIndexProfile.value]);
  }, [
    currentIndexProfile,
    nbFollowers,
    nbFollowersValue,
    nbFollowings,
    nbFollowingsValue,
    nbLikes,
    nbLikesValue,
    nbPosts,
    nbPostsValue,
  ]);

  useAnimatedReaction(
    () => currentIndexSharedValue.value,
    actual => {
      if (actual >= 0 && inputRange && inputRange.value.length > 1) {
        nbLikes.value = format(
          interpolate(actual, inputRange.value, nbLikesValue),
        );
        nbPosts.value = format(
          interpolate(actual, inputRange.value, nbPostsValue),
        );
        nbFollowers.value = format(
          interpolate(actual, inputRange.value, nbFollowersValue),
        );
        nbFollowings.value = format(
          interpolate(actual, inputRange.value, nbFollowingsValue),
        );
      } else if (actual >= 0) {
        nbPosts.value = format(nbPostsValue[actual]);
        nbLikes.value = format(nbLikesValue[actual]);
        nbFollowers.value = format(nbFollowersValue[actual]);
        nbFollowings.value = format(nbFollowingsValue[actual]);
      }
    },
  );

  const router = useRouter();
  const goToPosts = useCallback(() => {
    const currentProfile = profiles?.[currentIndexProfile.value - 1];
    if (currentProfile?.webCard?.userName) {
      router.push({
        route: 'WEBCARD',
        params: {
          userName: currentProfile.webCard.userName,
          webCardId: currentProfile.webCard.id,
          showPosts: true,
        },
      });
    }
  }, [currentIndexProfile.value, profiles, router]);

  const goToLikedPost = useCallback(() => {
    router.push({
      route: 'LIKED_POSTS',
    });
  }, [router]);

  const goToFollowing = useCallback(() => {
    router.push({
      route: 'FOLLOWINGS',
    });
  }, [router]);

  const goToFollower = useCallback(() => {
    router.push({
      route: 'FOLLOWERS',
    });
  }, [router]);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.row}>
        <PressableOpacity style={styles.square} onPress={goToPosts}>
          <AnimatedText variant="xlarge" text={nbPosts} appearance="dark" />
          <Text variant="small" style={styles.text}>
            <FormattedMessage
              defaultMessage="Posts"
              description="HomeScreen - information panel - Post label"
            />
          </Text>
        </PressableOpacity>
        <PressableOpacity style={styles.square} onPress={goToLikedPost}>
          <AnimatedText variant="xlarge" text={nbLikes} appearance="dark" />
          <Text variant="small" style={styles.text}>
            <FormattedMessage
              defaultMessage="Likes"
              description="HomeScreen - information panel - Likes label"
            />
          </Text>
        </PressableOpacity>
      </View>
      <View style={styles.row}>
        <PressableOpacity style={styles.square} onPress={goToFollower}>
          <AnimatedText variant="xlarge" text={nbFollowers} appearance="dark" />
          <Text variant="small" style={styles.text}>
            <FormattedMessage
              defaultMessage="Followers"
              description="HomeScreen - information panel - Followers label"
            />
          </Text>
        </PressableOpacity>
        <PressableOpacity style={styles.square} onPress={goToFollowing}>
          <AnimatedText
            variant="xlarge"
            text={nbFollowings}
            appearance="dark"
          />
          <Text variant="small" style={styles.text}>
            <FormattedMessage
              defaultMessage="Followings"
              description="HomeScreen - information panel - Followings label"
            />
          </Text>
        </PressableOpacity>
      </View>
    </View>
  );
};

export default memo(HomeInformations);

export const format = (value: number) => {
  'worklet';
  if (typeof value === 'number') {
    return Math.round(value).toString();
  }
  return '-1';
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    rowGap: 12,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    columnGap: 12,
  },
  square: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  text: {
    color: colors.white,
  },
});
