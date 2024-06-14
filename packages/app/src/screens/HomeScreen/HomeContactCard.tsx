import { useCallback } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { shadow } from '#theme';
import ContactCard, {
  CONTACT_CARD_RADIUS_HEIGHT,
  CONTACT_CARD_RATIO,
} from '#components/ContactCard/ContactCard';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAuthState from '#hooks/useAuthState';
import PressableNative from '#ui/PressableNative';
import { useHomeScreenCurrentIndex } from './HomeScreenContext';
import type { HomeContactCard_profile$key } from '#relayArtifacts/HomeContactCard_profile.graphql';
import type { HomeContactCard_user$key } from '#relayArtifacts/HomeContactCard_user.graphql';

type HomeContactCardProps = {
  user: HomeContactCard_user$key;
  height: number;
};

const HomeContactCard = ({ user, height }: HomeContactCardProps) => {
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
        <ContactCardItem
          key={item.webCard.id}
          width={windowWidth}
          height={height}
          item={item}
          index={index}
        />
      ))}
    </View>
  );
};

export default HomeContactCard;

type ContactCardItemProps = {
  width: number;
  height: number;
  item: HomeContactCard_profile$key;
  index: number;
};

const ContactCardItem = ({
  width,
  height,
  item,
  index,
}: ContactCardItemProps) => {
  const styles = useStyleSheet(styleSheet);
  const currentIndexSharedValue = useHomeScreenCurrentIndex();
  const positionStyle = useAnimatedStyle(() => ({
    //index start a 0 for the firstItem, so add +1 in thisd case
    transform: [
      { translateX: (index - currentIndexSharedValue.value + 1) * width },
    ],
  }));

  const maxWidth = width - 40;
  const maxHeight = maxWidth / CONTACT_CARD_RATIO;
  const cardHeight = Math.min(height, maxHeight);

  const profile = useFragment(
    graphql`
      fragment HomeContactCard_profile on Profile {
        id
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

  const authState = useAuthState();
  const router = useRouter();
  const disabled = authState.profileInfos?.profileId !== profile.id;

  const onPressContactCard = useCallback(() => {
    if (!disabled) {
      router.push({
        route: 'CONTACT_CARD',
      });
    }
  }, [disabled, router]);

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
          <View
            style={{
              borderRadius: cardHeight * CONTACT_CARD_RADIUS_HEIGHT,
              overflow: 'hidden',
            }}
          >
            <PressableNative
              ripple={{
                borderless: true,
                foreground: true,
                radius: cardHeight,
              }}
              onPress={onPressContactCard}
            >
              <ContactCard
                profile={profile}
                height={Math.min(height, maxHeight)}
                style={styles.card}
              />
            </PressableNative>
          </View>
        )}
    </Animated.View>
  );
};

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
