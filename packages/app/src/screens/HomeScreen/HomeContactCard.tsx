import { memo, useCallback } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
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
const windowWidth = Dimensions.get('screen').width;
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
          height={height}
          item={item}
          index={index}
        />
      ))}
    </View>
  );
};

export default memo(HomeContactCard);

type ContactCardItemProps = {
  height: number;
  item: HomeContactCard_profile$key;
  index: number;
};

const ContactCardItemComponent = ({
  height,
  item,
  index,
}: ContactCardItemProps) => {
  const styles = useStyleSheet(styleSheet);
  const currentIndexSharedValue = useHomeScreenCurrentIndex();

  const translateX = useDerivedValue(() => {
    'worklet';
    return (index - currentIndexSharedValue.value + 1) * windowWidth;
  }, [index, windowWidth]);

  const positionStyle = useAnimatedStyle(() => {
    return {
      //index start a 0 for the firstItem, so add +1 in thisd case
      transform: [{ translateX: translateX.value }],
    };
  });

  const maxHeight = (windowWidth - 40) / CONTACT_CARD_RATIO;
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
          width: windowWidth,
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
const ContactCardItem = memo(ContactCardItemComponent);

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
