import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, useWindowDimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import { CONTACT_CARD_ASPECT_RATIO } from '#components/ContactCard/ContactCard';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import Skeleton from '#components/Skeleton';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { WebCardStatHeader_webCard$key } from '#relayArtifacts/WebCardStatHeader_webCard.graphql';

type WebCardStatHeaderProps = {
  /**
   * @type {WebCardMenu_webCard$key}
   */
  webCard: WebCardStatHeader_webCard$key;
  onLeave?: () => void;
};

const WebCardStatHeader = ({
  webCard: webCardKey,
  onLeave,
}: WebCardStatHeaderProps) => {
  const styles = useStyleSheet(stylesheet);

  const webCard = useFragment(
    graphql`
      fragment WebCardStatHeader_webCard on WebCard {
        nbPosts
        nbFollowers
        nbFollowings
        nbLikes
        coverIsPredefined
        userName
        id
        ...CoverRenderer_webCard
      }
    `,
    webCardKey,
  );
  const { width: windowsWith } = useWindowDimensions();

  const router = useRouter();
  const goToFollowers = useCallback(() => {
    router.push({
      route: 'FOLLOWERS',
    });
    onLeave?.();
  }, [onLeave, router]);

  const goToLikedPost = useCallback(() => {
    router.push({
      route: 'LIKED_POSTS',
    });
    onLeave?.();
  }, [router, onLeave]);

  const goToFollowing = useCallback(() => {
    router.push({
      route: 'FOLLOWINGS',
    });
    onLeave?.();
  }, [router, onLeave]);

  const intl = useIntl();
  const goToPosts = useCallback(() => {
    if (webCard?.coverIsPredefined) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage(
          {
            defaultMessage: 'You have to create your WebCard{azzappA} first',
            description:
              'Home screen - error message when trying to access posts without a webcard',
          },
          {
            azzappA: <Text variant="azzapp">a</Text>,
          },
        ) as unknown as string,
        visibilityTime: 2000,
      });
      return;
    }

    if (webCard?.userName) {
      router.push({
        route: 'WEBCARD',
        params: {
          userName: webCard.userName,
          webCardId: webCard.id,
          showPosts: true,
        },
      });
      onLeave?.();
    }
  }, [
    webCard?.coverIsPredefined,
    webCard.userName,
    webCard.id,
    intl,
    router,
    onLeave,
  ]);

  return (
    <>
      <View style={styles.coverContainer}>
        <CoverRenderer
          webCard={webCard}
          width={windowsWith / 3}
          canPlay={false}
        />
      </View>
      <View style={styles.countersContainer}>
        <PressableOpacity style={styles.counterContainer} onPress={goToPosts}>
          <Text variant="xlarge">{webCard?.nbPosts}</Text>
          <Text variant="small" style={styles.counterValue} numberOfLines={1}>
            <FormattedMessage
              defaultMessage="{count, plural,
                    =0 {Posts}
                    =1 {Post}
                    other {Posts}}"
              description="Number of posts"
              values={{ count: webCard?.nbPosts }}
            />
          </Text>
        </PressableOpacity>
        <PressableOpacity
          style={styles.counterContainer}
          onPress={goToLikedPost}
        >
          <Text variant="xlarge">{webCard?.nbLikes}</Text>
          <Text variant="small" style={styles.counterValue} numberOfLines={1}>
            <FormattedMessage
              defaultMessage="{count, plural,
      =0 {Likes}
      =1 {Like}
      other {Likes}}"
              description="Number of Likes"
              values={{ count: webCard?.nbLikes }}
            />
          </Text>
        </PressableOpacity>
        <PressableOpacity
          style={styles.counterContainer}
          onPress={goToFollowers}
        >
          <Text variant="xlarge">{webCard?.nbFollowers}</Text>
          <Text variant="small" style={styles.counterValue} numberOfLines={1}>
            <FormattedMessage
              defaultMessage="{count, plural,
     =0 {Followers}
     =1 {Follower}
     other {Followers}}"
              values={{ count: webCard?.nbFollowers }}
              description="Number of followers"
            />
          </Text>
        </PressableOpacity>
        <PressableOpacity
          style={styles.counterContainer}
          onPress={goToFollowing}
        >
          <Text variant="xlarge">{webCard?.nbFollowings}</Text>
          <Text variant="small" style={styles.counterValue} numberOfLines={1}>
            <FormattedMessage
              defaultMessage="{count, plural,
                    =0 {Followings}
                    =1 {Following}
                    other {Followings}}"
              description="Number of followed webcards"
              values={{ count: webCard?.nbFollowings }}
            />
          </Text>
        </PressableOpacity>
      </View>
    </>
  );
};

export const WebCardStatHeaderFallback = () => {
  const styles = useStyleSheet(stylesheet);
  const { width: windowsWith } = useWindowDimensions();
  return (
    <>
      <View style={styles.coverContainer}>
        <Skeleton
          style={{
            width: windowsWith / 3,
            aspectRatio: CONTACT_CARD_ASPECT_RATIO,
            borderRadius: 20,
          }}
        />
      </View>
      <View style={styles.countersContainer}>
        <Skeleton style={styles.counterContainer} />
        <Skeleton style={styles.counterContainer} />
        <Skeleton style={styles.counterContainer} />
        <Skeleton style={styles.counterContainer} />
      </View>
    </>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  coverContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  countersContainer: {
    flexDirection: 'row',
    columnGap: 5,
    paddingHorizontal: 10,
    height: 60,
  },
  counterContainer: {
    width: 85,
    height: 60,
    alignItems: 'center',
    flex: 1,
    backgroundColor: appearance === 'dark' ? colors.grey1000 : colors.grey50,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  counterValue: {
    color: colors.grey400,
  },
}));

export default WebCardStatHeader;
