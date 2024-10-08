import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  useAnimatedReaction,
  interpolate,
  useSharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { useRouter } from '#components/NativeRouter';
import { HomeButtonContactLink } from './HomeButtonContactLink';
import { HomeButtonContactLinkCentral } from './HomeButtonContactLinkCentral';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeInformations_user$key } from '#relayArtifacts/HomeInformations_user.graphql';
import type { LayoutChangeEvent } from 'react-native';

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
          nbContacts
          webCard {
            id
            userName
            firstName
            nbPosts
            nbFollowings
            nbFollowers
            nbPostsLiked
            cardColors {
              primary
            }
          }
        }
      }
    `,
    user,
  );

  const nbContactsValue = useMemo(
    () => [0, ...(profiles?.map(({ nbContacts }) => nbContacts) ?? [])],
    [profiles],
  );

  const nbLikesValue = useMemo(
    () => [
      0,
      ...(profiles?.map(({ webCard }) => webCard?.nbPostsLiked ?? 0) ?? []),
    ],
    [profiles],
  );
  const nbFollowersValue = useMemo(
    () => [
      0,
      ...(profiles?.map(({ webCard }) => webCard?.nbFollowers ?? 0) ?? []),
    ],
    [profiles],
  );

  const nbFollowingsValue = useMemo(
    () => [
      0,
      ...(profiles?.map(({ webCard }) => webCard?.nbFollowings ?? 0) ?? []),
    ],
    [profiles],
  );

  const nbPostsValue = useMemo(
    () => [0, ...(profiles?.map(({ webCard }) => webCard?.nbPosts ?? 0) ?? [])],
    [profiles],
  );

  const primaryColorValue = useMemo(
    () => [
      '#000000',
      ...(profiles?.map(
        ({ webCard }) => webCard?.cardColors?.primary ?? '#000000',
      ) ?? []),
    ],
    [profiles],
  );

  const contactsTextColorValue = useMemo(
    () => primaryColorValue.map(color => getTextColor(color)),
    [primaryColorValue],
  );

  const nbPosts = useSharedValue('-1');
  const nbLikes = useSharedValue('-1');
  const nbFollowers = useSharedValue('-1');
  const nbFollowings = useSharedValue('-1');
  const nbContacts = useSharedValue('-1');
  const contactsTextColor = useSharedValue('-1');
  const primaryColor = useSharedValue('#000000');

  const { currentIndexSharedValue, currentIndexProfile, inputRange } =
    useHomeScreenContext();
  //using profiles object directly in animatedReaction causes error animatedHost(seems to be the case for all relay query result)
  useEffect(() => {
    nbPosts.value = format(nbPostsValue[currentIndexProfile.value]);
    nbLikes.value = format(nbLikesValue[currentIndexProfile.value]);
    nbFollowings.value = format(nbFollowingsValue[currentIndexProfile.value]);
    nbFollowers.value = format(nbFollowersValue[currentIndexProfile.value]);
    nbContacts.value = format(nbContactsValue[currentIndexProfile.value]);
    primaryColor.value = primaryColorValue[currentIndexProfile.value];
    contactsTextColor.value = contactsTextColorValue[currentIndexProfile.value];
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
    nbContacts,
    nbContactsValue,
    primaryColor,
    primaryColorValue,
    contactsTextColor,
    contactsTextColorValue,
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
        nbContacts.value = format(
          interpolate(actual, inputRange.value, nbContactsValue),
        );
        primaryColor.value = interpolateColor(
          actual,
          inputRange.value,
          primaryColorValue,
        );
        contactsTextColor.value = interpolateColor(
          actual,
          inputRange.value,
          contactsTextColorValue,
        );
      } else if (actual >= 0) {
        nbPosts.value = format(nbPostsValue[actual]);
        nbLikes.value = format(nbLikesValue[actual]);
        nbFollowers.value = format(nbFollowersValue[actual]);
        nbFollowings.value = format(nbFollowingsValue[actual]);
        nbContacts.value = format(nbContactsValue[actual]);
        primaryColor.value = primaryColorValue[actual];
        contactsTextColor.value = contactsTextColorValue[actual];
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

  const goToContacts = useCallback(() => {
    router.push({
      route: 'CONTACTS',
    });
  }, [router]);

  const [circleWidth, setCircleWidth] = useState(100);

  const onMainLayout = (event: LayoutChangeEvent) => {
    const newHeight = event.nativeEvent.layout.height / 2 - 12;
    setCircleWidth(newHeight);
  };

  return (
    <View style={[styles.container, { height }]} onLayout={onMainLayout}>
      <View style={styles.row} pointerEvents="box-none">
        <HomeButtonContactLink
          svgFile={require('#assets/home-top-left.svg')}
          count={nbPosts}
          onPress={goToPosts}
          isTop
          isLeft
          renderMessageComponent={isPlural => (
            <FormattedMessage
              defaultMessage="{isPlural, plural,
      =0 {Post}
      other {Posts}
    }"
              description="HomeScreen - information panel - Post label"
              values={{ isPlural }}
            />
          )}
        />
        <HomeButtonContactLink
          svgFile={require('#assets/home-top-right.svg')}
          count={nbLikes}
          onPress={goToLikedPost}
          isTop
          renderMessageComponent={isPlural => (
            <FormattedMessage
              defaultMessage="{isPlural, plural,
      =0 {Like}
      other {Likes}
    }"
              description="HomeScreen - information panel - Likes label"
              values={{ isPlural }}
            />
          )}
        />
      </View>
      <View style={styles.row}>
        <HomeButtonContactLink
          svgFile={require('#assets/home-bottom-left.svg')}
          count={nbFollowers}
          onPress={goToFollower}
          isLeft
          renderMessageComponent={isPlural => (
            <FormattedMessage
              defaultMessage="{isPlural, plural,
    =0 {Follower}
    other {Followers}
    }"
              description="HomeScreen - information panel - Followers label"
              values={{ isPlural }}
            />
          )}
        />
        <HomeButtonContactLink
          svgFile={require('#assets/home-bottom-right.svg')}
          count={nbFollowings}
          onPress={goToFollowing}
          renderMessageComponent={isPlural => (
            <FormattedMessage
              defaultMessage="{isPlural, plural,
    =0 {Following}
    other {Following}
    }"
              description="HomeScreen - information panel - Followings label"
              values={{ isPlural }}
            />
          )}
        />
      </View>
      {/* central circle */}
      <HomeButtonContactLinkCentral
        circleWidth={circleWidth}
        onPress={goToContacts}
        primaryColor={primaryColor}
        contactsTextColor={contactsTextColor}
        count={nbContacts}
      />
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
    paddingVertical: 30,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
});
