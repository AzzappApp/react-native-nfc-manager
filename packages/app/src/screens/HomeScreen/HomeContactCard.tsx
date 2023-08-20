import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
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
import type { ListRenderItemInfo } from '@shopify/flash-list';
import type { SharedValue } from 'react-native-reanimated';

type HomeContacCardProps = {
  user: HomeContactCard_user$key;
  height: number;
  animated: boolean;
  currentProfileIndexSharedValue: SharedValue<number>;
};

const HomeContactCard = ({
  user,
  height,
  animated,
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
  const { width } = useWindowDimensions();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ProfileType>) => {
      return (
        //receive warning during test for not optimzed content and large list issue.(create a PureComponent)
        // after test, the js thread was less imapacted, almost max all the time at 60 fps
        <MemoContactCardItem width={width} height={height} item={item} />
      );
    },
    [height, width],
  );
  const ref = useRef<FlashList<ProfileType>>(null);

  const scrollToOffset = useCallback(
    (index: number) => {
      ref.current?.scrollToOffset({
        offset: index * width,
        animated: false,
      });
    },
    [width],
  );

  useAnimatedReaction(
    () => currentProfileIndexSharedValue.value,
    current => {
      if (current >= 0 && animated) {
        runOnJS(scrollToOffset)(current);
      } else if (current >= 0 && !animated && Math.trunc(current) === current) {
        runOnJS(scrollToOffset)(Math.trunc(current));
      }
    },
    [animated],
  );

  return (
    <FlashList<ProfileType>
      ref={ref}
      horizontal
      data={profiles}
      estimatedItemSize={width}
      renderItem={renderItem}
      scrollEnabled={false}
      keyExtractor={keyExtractor}
      //perf improvement settings(to refine is necessary)
      estimatedListSize={{ height, width }}
      disableHorizontalListHeightMeasurement
    />
  );
};

const keyExtractor = (item: ProfileType) => item.id;

export default memo(HomeContactCard);

type ProfileType = ArrayItemType<HomeContactCard_user$data['profiles']>;

type ContactCardItemProps = {
  width: number;
  height: number;
  item: ProfileType;
};
const ContactCardItem = ({ width, height, item }: ContactCardItemProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <Link route="CONTACT_CARD">
      <PressableNative style={[{ width, height }, styles.itemContainer]}>
        <View style={styles.card}>
          <ContactCard profile={item} height={height - 4} />
        </View>
      </PressableNative>
    </Link>
  );
};
const MemoContactCardItem = memo(ContactCardItem);

const styleSheet = createStyleSheet(appearance => ({
  itemContainer: {
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
