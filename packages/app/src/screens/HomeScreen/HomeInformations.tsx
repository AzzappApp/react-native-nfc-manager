import _ from 'lodash';
import { memo, useCallback, useMemo } from 'react';
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
import type { HomeInformations_user$key } from '#relayArtifacts/HomeInformations_user.graphql';
import type { SharedValue } from 'react-native-reanimated';
type HomeInformationsProps = {
  user: HomeInformations_user$key;
  height: number;
  currentProfileIndexSharedValue: SharedValue<number>;
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
const HomeInformations = ({
  height,
  user,
  currentProfileIndexSharedValue,
}: HomeInformationsProps) => {
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
    () => profiles?.map(({ webCard }) => webCard.nbPostsLiked) ?? [],
    [profiles],
  );
  const nbFollowersValue = useMemo(
    () => profiles?.map(({ webCard }) => webCard.nbFollowers) ?? [],
    [profiles],
  );

  const nbFollowingsValue = useMemo(
    () => profiles?.map(({ webCard }) => webCard.nbFollowings) ?? [],
    [profiles],
  );

  const nbPostsValue = useMemo(
    () => profiles?.map(({ webCard }) => webCard.nbPosts) ?? [],
    [profiles],
  );

  const nbPosts = useSharedValue(
    format(
      nbPostsValue[Math.round(currentProfileIndexSharedValue.value)] ?? '-1',
    ),
  );
  const nbLikes = useSharedValue(
    format(
      nbLikesValue[Math.round(currentProfileIndexSharedValue.value)] ?? '-1',
    ),
  );
  const nbFollowers = useSharedValue(
    format(
      nbFollowersValue[Math.round(currentProfileIndexSharedValue.value)] ??
        '-1',
    ),
  );
  const nbFollowings = useSharedValue(
    format(
      nbFollowingsValue[Math.round(currentProfileIndexSharedValue.value)] ??
        '-1',
    ),
  );
  //using profiles object directly in animatedReaction causes error animatedHost(seems to be the case for all relay query result)

  const inputRange = useMemo(
    () => _.range(0, profiles?.length),
    [profiles?.length],
  );

  useAnimatedReaction(
    () => currentProfileIndexSharedValue.value,
    actual => {
      if (actual >= 0 && inputRange && inputRange?.length > 1) {
        nbLikes.value = format(interpolate(actual, inputRange, nbLikesValue));
        nbPosts.value = format(interpolate(actual, inputRange, nbPostsValue));
        nbFollowers.value = format(
          interpolate(actual, inputRange, nbFollowersValue),
        );
        nbFollowings.value = format(
          interpolate(actual, inputRange, nbFollowingsValue),
        );
      } else if (actual >= 0) {
        nbPosts.value = format(nbPostsValue[actual]);
        nbLikes.value = format(nbLikesValue[actual]);
        nbFollowers.value = format(nbFollowersValue[actual]);
        nbFollowings.value = format(nbFollowingsValue[actual]);
      }
    },
    [
      inputRange,
      nbFollowersValue,
      nbFollowingsValue,
      nbLikesValue,
      nbPostsValue,
    ],
  );
  const router = useRouter();
  const goToPosts = useCallback(() => {
    const currentProfile =
      profiles?.[Math.round(currentProfileIndexSharedValue.value)];
    if (currentProfile?.webCard.userName) {
      router.push({
        route: 'WEBCARD',
        params: {
          userName: currentProfile.webCard.userName,
          webCardId: currentProfile.webCard.id,
          showPosts: true,
        },
      });
    }
  }, [currentProfileIndexSharedValue.value, profiles, router]);

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
  return '0';
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
