import _ from 'lodash';
import { memo, useMemo } from 'react';
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
import Link from '#components/Link';
import useAuthState from '#hooks/useAuthState';
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

  const nbPosts = useSharedValue('0');
  const nbLikes = useSharedValue('0');
  const nbFollowers = useSharedValue('0');
  const nbFollowings = useSharedValue('0');
  //using profiles object directly in animatedReaction causes error animatedHost(seems to be the case for all relay query result)
  const { profileInfos } = useAuthState();

  const currentProfile = (profiles ?? []).find(
    p => p.id === profileInfos?.profileId,
  );

  const inputRange = _.range(0, profiles?.length);

  useAnimatedReaction(
    () => currentProfileIndexSharedValue.value,
    actual => {
      if (actual >= 0 && profiles && profiles?.length > 1) {
        nbLikes.value = format(interpolate(actual, inputRange, nbLikesValue));
        nbPosts.value = format(interpolate(actual, inputRange, nbPostsValue));
        nbFollowers.value = format(
          interpolate(actual, inputRange, nbFollowersValue),
        );
        nbFollowings.value = format(
          interpolate(actual, inputRange, nbFollowingsValue),
        );
      } else if (actual >= 0) {
        nbPosts.value = '0';
        nbLikes.value = '0';
        nbFollowers.value = '0';
        nbFollowings.value = '0';
      }
    },
    [profiles],
  );

  if (!currentProfile) {
    return null;
  }

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.row}>
        <Link
          route="WEBCARD"
          params={{
            userName: currentProfile.webCard.userName,
            webCardId: currentProfile.webCard.id,
            showPosts: true,
          }}
        >
          <PressableOpacity style={styles.square}>
            <AnimatedText variant="xlarge" text={nbPosts} appearance="dark" />
            <Text variant="small" style={styles.text}>
              <FormattedMessage
                defaultMessage="Posts"
                description="HomeScreen - information panel - Post label"
              />
            </Text>
          </PressableOpacity>
        </Link>
        <Link route="LIKED_POSTS">
          <PressableOpacity style={styles.square}>
            <AnimatedText variant="xlarge" text={nbLikes} appearance="dark" />
            <Text variant="small" style={styles.text}>
              <FormattedMessage
                defaultMessage="Likes"
                description="HomeScreen - information panel - Likes label"
              />
            </Text>
          </PressableOpacity>
        </Link>
      </View>
      <View style={styles.row}>
        <Link route="FOLLOWERS">
          <PressableOpacity style={styles.square}>
            <AnimatedText
              variant="xlarge"
              text={nbFollowers}
              appearance="dark"
            />
            <Text variant="small" style={styles.text}>
              <FormattedMessage
                defaultMessage="Followers"
                description="HomeScreen - information panel - Followers label"
              />
            </Text>
          </PressableOpacity>
        </Link>
        <Link route="FOLLOWINGS">
          <PressableOpacity style={styles.square}>
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
        </Link>
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
