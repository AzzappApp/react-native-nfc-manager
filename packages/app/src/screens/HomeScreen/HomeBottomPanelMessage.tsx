import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import HomeBottomPanelCreate from './HomeBottomPanelCreate';
import HomeBottomPanelInvitation from './HomeBottomPanelInvitation';
import HomeBottomPanelNewCover from './HomeBottomPanelNewCover';
import HomeBottomPanelPublish from './HomeBottomPanelPublish';
import HomeBottomPanelTransfertOwner from './HomeBottomPanelTransfertOwner';
import type {
  HomeBottomPanelMessage_profiles$data,
  HomeBottomPanelMessage_profiles$key,
} from '#relayArtifacts/HomeBottomPanelMessage_profiles.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { SharedValue } from 'react-native-reanimated';

export type MessageContentType =
  | 'cover'
  | 'invitation'
  | 'publish'
  | 'transfert';

type HomeBottomPanelMessageProps = {
  currentProfileIndexSharedValue: SharedValue<number>;
  user: HomeBottomPanelMessage_profiles$key;
};
const HomeBottomPanelMessage = ({
  currentProfileIndexSharedValue,
  user,
}: HomeBottomPanelMessageProps) => {
  const profiles = useFragment(
    graphql`
      fragment HomeBottomPanelMessage_profiles on Profile @relay(plural: true) {
        id
        invited
        profileRole
        promotedAsOwner
        webCard {
          userName
          cardIsPublished
          cardCover {
            segmented #segmented is the only mandatory field in a card Cover
          }
          owner {
            email
            phoneNumber
          }
          cardModules {
            id
            kind
          }
          webCardKind
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
        return { type: 'transfert', profile };
      } else if (profile.invited) {
        return { type: 'invitation', profile };
      } else if (!profile.webCard?.cardCover) {
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
        return (
          <MessageItem
            key={index}
            content={content}
            index={index}
            currentIndex={currentProfileIndexSharedValue}
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
  currentIndex: SharedValue<number>;
};

const MessageItem = ({ content, index, currentIndex }: MessageItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    //math.pow is used to reduce the superposition of 2 view, the increase is not linear, going slowly at the beginning
    const opacity = Math.pow(
      Math.max(
        0,
        interpolate(
          currentIndex.value + 1,
          [index - 1, index, index + 1],
          [0, 1, 0],
        ),
      ),
      4,
    );

    return {
      opacity,
      pointerEvents: opacity > 0.5 ? 'box-none' : 'none',
    };
  }, [currentIndex]);

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
      ) : content.type === 'transfert' ? (
        <HomeBottomPanelTransfertOwner profile={content.profile} />
      ) : content.type === 'create' ? (
        <HomeBottomPanelCreate />
      ) : null}
    </Animated.View>
  );
};
type MessageArrayType = Array<{
  type: MessageContentType;
  profile: ArrayItemType<HomeBottomPanelMessage_profiles$data>;
} | null>;

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
});
