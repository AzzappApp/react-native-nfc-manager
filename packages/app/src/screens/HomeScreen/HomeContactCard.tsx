import { memo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { shadow } from '#theme';
import ContactCard from '#components/ContactCard';
import Link from '#components/Link';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from '#ui/PressableNative';
import type {
  HomeContactCard_user$key,
  HomeContactCard_user$data,
} from '@azzapp/relay/artifacts/HomeContactCard_user.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { SharedValue } from 'react-native-reanimated';

type HomeContacCardProps = {
  user: HomeContactCard_user$key;
  height: number;
  currentProfileIndexSharedValue: SharedValue<number>;
};

const HomeContactCard = ({
  user,
  height,
  currentProfileIndexSharedValue,
}: HomeContacCardProps) => {
  const { profiles } = useFragment(
    graphql`
      fragment HomeContactCard_user on User {
        profiles {
          id
          userName
          ...ContactCard_profile
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
        <MemoContactCardItem
          key={item.id}
          width={windowWidth}
          height={height}
          item={item}
          currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          index={index}
        />
      ))}
    </View>
  );
};

export default memo(HomeContactCard);

type ProfileType = ArrayItemType<HomeContactCard_user$data['profiles']>;

type ContactCardItemProps = {
  width: number;
  height: number;
  item: ProfileType;
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
      <Link route="CONTACT_CARD">
        <PressableNative style={{ flex: 1 }}>
          <ContactCard profile={item} height={height - 4} style={styles.card} />
        </PressableNative>
      </Link>
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
