import { memo, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { shadow } from '#theme';
import ContactCard, {
  CONTACT_CARD_RADIUS_HEIGHT,
} from '#components/ContactCard/ContactCard';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeContactCard_profile$key } from '#relayArtifacts/HomeContactCard_profile.graphql';
import type { HomeContactCard_user$key } from '#relayArtifacts/HomeContactCard_user.graphql';
import type { ViewProps } from 'react-native';

type HomeContactCardProps = ViewProps & {
  user: HomeContactCard_user$key;
  height: number;
};

const GAP = 20;

const HomeContactCard = ({
  user,
  height,
  style,
  ...props
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

  const styles = useStyleSheet(styleSheet);

  const { width } = useScreenDimensions();

  const { currentIndexSharedValue } = useHomeScreenContext();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: -(currentIndexSharedValue.value - 1) * (width + GAP),
        },
      ],
    };
  }, [width, GAP, currentIndexSharedValue]);

  return (
    <View
      style={[
        {
          width,
          height,
          overflow: 'visible',
        },
        style,
      ]}
      {...props}
    >
      <Animated.View style={[styles.contactCardList, animatedStyle]}>
        {profiles?.map((item, index) => (
          <ContactCardItemMemo
            key={item.webCard?.id}
            height={height}
            item={item}
            position={index * (width + GAP)}
          />
        ))}
      </Animated.View>
    </View>
  );
};

export default memo(HomeContactCard);

type ContactCardItemProps = {
  height: number;
  position: number;
  item: HomeContactCard_profile$key;
};

const ContactCardItem = ({
  height,

  position,
  item,
}: ContactCardItemProps) => {
  const styles = useStyleSheet(styleSheet);

  const profile = useFragment(
    graphql`
      fragment HomeContactCard_profile on Profile {
        id
        webCard {
          userName
          cardIsPublished
          cardColors {
            primary
          }
        }
        invited
        promotedAsOwner
        ...ContactCard_profile
        lastContactCardUpdate
        createdAt
      }
    `,
    item,
  );

  const router = useRouter();

  const openContactCard = useCallback(() => {
    router.push({
      route: 'SHAKE_AND_SHARE',
    });
  }, [router]);

  return (
    <View style={{ height, position: 'absolute', top: 0, left: position }}>
      {profile.webCard?.cardIsPublished &&
        !profile.invited &&
        !profile.promotedAsOwner && (
          <View
            style={{
              borderRadius: height * CONTACT_CARD_RADIUS_HEIGHT,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity onPress={openContactCard}>
              <ContactCard
                profile={profile}
                height={height}
                style={styles.card}
                edit
              />
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
};

const ContactCardItemMemo = memo(ContactCardItem);

const styleSheet = createStyleSheet(appearance => ({
  contactCardList: {
    flex: 1,
    marginLeft: 20,
  },
  card: {
    ...shadow({ appearance }),
  },
}));
