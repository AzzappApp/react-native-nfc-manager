import { memo, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  useAnimatedReaction,
  interpolate,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors } from '#theme';
import AnimatedText from '#components/AnimatedText';
import Link from '#components/Link';
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

  // using relay result direclty inside animated hook cause crash
  const infosShared = useSharedValue(
    profiles?.map(({ webCard }) => {
      return {
        nbPosts: webCard.nbPosts,
        nbFollowings: webCard.nbFollowings,
        nbFollowers: webCard.nbFollowers,
        nbLikes: webCard.nbPostsLiked,
      };
    }) ?? [],
  );

  useEffect(() => {
    //updating the infosShared when profiles changed (after creating a new profile)
    if (profiles) {
      infosShared.value = profiles?.map(({ webCard }) => {
        return {
          nbPosts: webCard.nbPosts,
          nbFollowings: webCard.nbFollowings,
          nbFollowers: webCard.nbFollowers,
          nbLikes: webCard.nbPostsLiked,
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles]);

  //TODO: reanmiated 3 and computedValue for better performance
  const nbPosts = useSharedValue(format(infosShared.value[0].nbPosts ?? 0));
  const nbLikes = useSharedValue(format(infosShared.value[0].nbLikes ?? 0));
  const nbFollowers = useSharedValue(
    format(infosShared.value[0].nbFollowers ?? 0),
  );
  const nbFollowings = useSharedValue(
    format(infosShared.value[0].nbFollowings ?? 0),
  );

  //using profiles object directly in animatedReaction causes error animatedHost(seems to be the case for all relay query result)
  const [currentProfile, setCurrentProfile] = useState(profiles?.[0]);
  const defineCurrentProfile = (index: number) => {
    if (profiles && index >= 0 && index < profiles.length) {
      setCurrentProfile(profiles[index]);
    }
  };

  useAnimatedReaction(
    () => currentProfileIndexSharedValue.value,
    actual => {
      if (actual >= 0 && profiles && profiles?.length > 1) {
        runOnJS(defineCurrentProfile)(Math.floor(actual));

        const prevIndex = Math.floor(actual);
        const nextIndex = Math.ceil(actual);

        const previous = infosShared.value[prevIndex] ?? 0;
        //  const current = infosShared.value[currentIndex.value];
        const next =
          infosShared.value[
            Math.min(nextIndex, infosShared.value.length - 1)
          ] ?? 0;

        nbPosts.value = format(
          interpolate(
            actual,
            [prevIndex, nextIndex],
            [previous.nbPosts, next.nbPosts],
          ),
        );
        nbLikes.value = format(
          interpolate(
            actual,
            [prevIndex, nextIndex],
            [previous.nbLikes, next.nbLikes],
          ),
        );
        nbFollowers.value = format(
          interpolate(
            actual,
            [prevIndex, nextIndex],
            [previous.nbFollowers, next.nbFollowers],
          ),
        );
        nbFollowings.value = format(
          interpolate(
            actual,
            [prevIndex, nextIndex],
            [previous.nbFollowings, next.nbFollowings],
          ),
        );
      } else if (actual >= 0) {
        nbPosts.value = format(infosShared.value[0].nbPosts ?? 0);
        nbLikes.value = format(infosShared.value[0].nbLikes ?? 0);
        nbFollowers.value = format(infosShared.value[0].nbFollowers ?? 0);
        nbFollowings.value = format(infosShared.value[0].nbFollowings ?? 0);
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
    return Math.trunc(value).toString();
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
