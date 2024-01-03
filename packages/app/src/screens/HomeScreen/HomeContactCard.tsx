import { memo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { shadow } from '#theme';
import ContactCard, {
  CONTACT_CARD_RATIO,
} from '#components/ContactCard/ContactCard';
import Link from '#components/Link';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import WebCardBoundRelayEnvironmentProvider from '#helpers/WebCardBoundRelayEnvironmentProvider';
import PressableNative from '#ui/PressableNative';
import type { HomeContactCard_profile$key } from '@azzapp/relay/artifacts/HomeContactCard_profile.graphql';
import type { HomeContactCard_user$key } from '@azzapp/relay/artifacts/HomeContactCard_user.graphql';
import type { SharedValue } from 'react-native-reanimated';

type HomeContactCardProps = {
  user: HomeContactCard_user$key;
  height: number;
  currentProfileIndexSharedValue: SharedValue<number>;
};

const HomeContactCard = ({
  user,
  height,
  currentProfileIndexSharedValue,
}: HomeContactCardProps) => {
  const { profiles } = useFragment(
    graphql`
      fragment HomeContactCard_user on User {
        profiles {
          webCard {
            id
          }
          ...HomeContactCard_profile
        }
      }
    `,
    user,
  );

  const { width: windowWidth } = useWindowDimensions();

  return (
    <View
      style={{
        width: windowWidth,
        height,
        overflow: 'visible',
      }}
    >
      {profiles?.map((item, index) => (
        <WebCardBoundRelayEnvironmentProvider
          key={item.webCard.id}
          webCardId={item.webCard.id}
        >
          <MemoContactCardItem
            width={windowWidth}
            height={height}
            item={item}
            currentProfileIndexSharedValue={currentProfileIndexSharedValue}
            index={index}
          />
        </WebCardBoundRelayEnvironmentProvider>
      ))}
    </View>
  );
};

export default memo(HomeContactCard);

type ContactCardItemProps = {
  width: number;
  height: number;
  item: HomeContactCard_profile$key;
  index: number;
  currentProfileIndexSharedValue: SharedValue<number>;
};

const ContactCardItem = ({
  width,
  height,
  item,
  index,
  currentProfileIndexSharedValue,
}: ContactCardItemProps) => {
  const styles = useStyleSheet(styleSheet);

  const positionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (index - currentProfileIndexSharedValue.value) * width },
    ],
  }));

  const maxWidth = width - 40;
  const maxHeight = maxWidth / CONTACT_CARD_RATIO;
  const cardHeight = Math.min(height, maxHeight);

  const profile = useFragment(
    graphql`
      fragment HomeContactCard_profile on Profile {
        webCard {
          userName
          cardIsPublished
        }
        invited
        promotedAsOwner
        ...ContactCard_profile
      }
    `,
    item,
  );

  return (
    <Animated.View
      style={[
        {
          width,
          height,
        },
        styles.itemContainer,
        positionStyle,
      ]}
    >
      {profile.webCard.cardIsPublished &&
        !profile.invited &&
        !profile.promotedAsOwner && (
          <Link route="CONTACT_CARD">
            <PressableNative
              style={{
                width: cardHeight * CONTACT_CARD_RATIO,
                height: cardHeight,
                overflow: 'visible',
              }}
            >
              <ContactCard
                profile={profile}
                height={Math.min(height, maxHeight)}
                style={styles.card}
              />
            </PressableNative>
          </Link>
        )}
    </Animated.View>
  );
};
const MemoContactCardItem = memo(ContactCardItem);

const styleSheet = createStyleSheet(appearance => ({
  itemContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    overflow: 'visible',
  },
  card: {
    ...shadow(appearance),
  },
}));
