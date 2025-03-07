import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import HomeBottomPanelCreate from './HomeBottomPanelCreate';
import HomeBottomPanelInvitation from './HomeBottomPanelInvitation';
import HomeBottomPanelNewCover from './HomeBottomPanelNewCover';
import HomeBottomPanelPublish from './HomeBottomPanelPublish';
import HomeBottomPanelTransferOwner from './HomeBottomPanelTransferOwner';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeBottomPanel_user$data } from '#relayArtifacts/HomeBottomPanel_user.graphql';
import type {
  HomeBottomPanelMessage_profiles$data,
  HomeBottomPanelMessage_profiles$key,
} from '#relayArtifacts/HomeBottomPanelMessage_profiles.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

export type MessageContentType =
  | 'cover'
  | 'invitation'
  | 'publish'
  | 'transfer';

type HomeBottomPanelMessageProps = {
  user: HomeBottomPanelMessage_profiles$key;
  userSubscription: HomeBottomPanel_user$data['userSubscription'];
};
const HomeBottomPanelMessage = ({
  user,
  userSubscription,
}: HomeBottomPanelMessageProps) => {
  const profiles = useFragment(
    graphql`
      fragment HomeBottomPanelMessage_profiles on Profile @relay(plural: true) {
        id
        invited
        invitedBy {
          user {
            email
            phoneNumber
          }
        }
        profileRole
        promotedAsOwner
        webCard {
          userName
          cardIsPublished
          hasCover
          owner {
            email
            phoneNumber
          }
          requiresSubscription
          isPremium
          id
        }
      }
    `,
    user,
  );

  const bottomContent = useMemo(() => {
    const res = profiles?.map(profile => {
      if (!profile) return null;
      if (profile.promotedAsOwner) {
        return { type: 'transfer', profile };
      } else if (profile.invited) {
        return { type: 'invitation', profile };
      } else if (!profile.webCard?.hasCover) {
        return { type: 'cover', profile };
      } else if (!profile.webCard?.cardIsPublished) {
        return { type: 'publish', profile };
      } else {
        return null;
      }
    });
    return [{ type: 'create' }, ...res] as MessageArrayType;
  }, [profiles]);

  return (
    <View style={styles.container}>
      {(bottomContent ?? []).map((content, index) => {
        if (!content?.type) return null;
        return (
          <MessageItem
            key={index}
            content={content}
            index={index}
            userSubscription={userSubscription}
          />
        );
      })}
    </View>
  );
};

export default memo(HomeBottomPanelMessage);

type MessageItemProps = {
  content: ArrayItemType<MessageArrayType>;
  index: number;
  userSubscription: HomeBottomPanel_user$data['userSubscription'];
};

const MessageItemComponent = ({
  content,
  index,
  userSubscription,
}: MessageItemProps) => {
  const { currentIndexSharedValue } = useHomeScreenContext();

  const opacity = useDerivedValue(() => {
    return Math.pow(
      Math.max(
        0,
        interpolate(
          currentIndexSharedValue.value,
          [index - 1, index, index + 1],
          [0, 1, 0],
        ),
      ),
      4,
    );
  });
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      pointerEvents: opacity.value > 0.5 ? 'box-none' : 'none',
    };
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        },
        animatedStyle,
      ]}
    >
      {content == null ? null : content.type === 'publish' ? (
        <HomeBottomPanelPublish profile={content.profile} />
      ) : content.type === 'cover' ? (
        <HomeBottomPanelNewCover profile={content.profile} />
      ) : content.type === 'invitation' ? (
        <HomeBottomPanelInvitation profile={content.profile} />
      ) : content.type === 'transfer' ? (
        <HomeBottomPanelTransferOwner
          profile={content.profile}
          userSubscription={userSubscription}
        />
      ) : content.type === 'create' ? (
        <HomeBottomPanelCreate />
      ) : null}
    </Animated.View>
  );
};

const MessageItem = memo(MessageItemComponent);
type MessageArrayType = Array<{
  type: MessageContentType;
  profile: ArrayItemType<HomeBottomPanelMessage_profiles$data>;
} | null>;

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
});
