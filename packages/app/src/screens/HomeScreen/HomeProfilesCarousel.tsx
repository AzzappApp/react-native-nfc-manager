import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { useWorkletCallback } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import CoverLink from '#components/CoverLink';
import CoverRenderer from '#components/CoverRenderer';
import Link from '#components/Link';
import CarouselSelectList from '#ui/CarouselSelectList';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type {
  HomeProfilesCarousel_user$key,
  HomeProfilesCarousel_user$data,
} from '@azzapp/relay/artifacts/HomeProfilesCarousel_user.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ForwardedRef } from 'react';
import type { GestureResponderEvent, ListRenderItemInfo } from 'react-native';

type HomeProfilesCarouselProps = {
  /**
   * The current user
   */
  user: HomeProfilesCarousel_user$key;
  /**
   * The initial profile index to display
   */
  initialProfileIndex?: number;
  /**
   * Callback when the user change the current profile
   */
  onCurrentProfileIndexChange: (index: number) => void;
  /**
   * Animated callback called during the profile switch, index is a floating number
   * the callback passed should be a worklet
   */
  onCurrentProfileIndexChangeAnimated: (index: number) => void;
  /**
   * The height of the carousel
   */
  height: number;
};

export type HomeProfilesCarouselHandle = {
  scrollToProfileIndex: (index: number, animated?: boolean) => void;
};

const HomeProfilesCarousel = (
  {
    user: userKey,
    height,
    onCurrentProfileIndexChange,
    onCurrentProfileIndexChangeAnimated,
    initialProfileIndex = 0,
  }: HomeProfilesCarouselProps,
  ref: ForwardedRef<HomeProfilesCarouselHandle>,
) => {
  const { profiles } = useFragment(
    graphql`
      fragment HomeProfilesCarousel_user on User {
        profiles {
          id
          userName
          cardCover {
            title
          }
          ...CoverLink_profile
          ...CoverRenderer_profile
        }
      }
    `,
    userKey,
  );

  const { width: windowWidth } = useWindowDimensions();
  const coverHeight = height - 2 * MARGIN;
  const coverWidth = Math.trunc(coverHeight * COVER_RATIO);

  const carouselRef = useRef<CarouselSelectListHandle | null>(null);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const onSelectedIndexChange = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      onCurrentProfileIndexChange(index - 1);
    },
    [onCurrentProfileIndexChange],
  );

  const onSelectedIndexChangeAnimated = useWorkletCallback(
    (index: number) => {
      'worlket';
      onCurrentProfileIndexChangeAnimated(index - 1);
    },
    [onCurrentProfileIndexChangeAnimated],
  );

  const scrollToIndex = useCallback((index: number, animated?: boolean) => {
    carouselRef.current?.scrollToIndex(index, animated);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToProfileIndex: index => scrollToIndex(index + 1),
    }),
    [scrollToIndex],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ProfileType | null>) => (
      <ItemRender
        item={item}
        coverHeight={coverHeight}
        coverWidth={coverWidth}
        index={index}
        scrollToIndex={scrollToIndex}
        currentUserIndex={selectedIndex}
      />
    ),
    [coverHeight, coverWidth, selectedIndex, scrollToIndex],
  );

  const data = useMemo(
    () => (profiles ? [null, ...profiles] : [null]),
    [profiles],
  );

  if (height <= 0 || profiles == null) {
    return null;
  }

  return (
    <View
      style={{
        width: windowWidth,
        height,
        paddingVertical: MARGIN,
      }}
    >
      <CarouselSelectList
        ref={carouselRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        width={windowWidth}
        height={coverHeight}
        itemWidth={coverWidth}
        scaleRatio={SCALE_RATIO}
        style={styles.carousel}
        itemContainerStyle={styles.carouselContentContainer}
        onSelectedIndexChange={onSelectedIndexChange}
        onSelectedIndexChangeAnimated={onSelectedIndexChangeAnimated}
        initialScrollIndex={initialProfileIndex + 1}
      />
    </View>
  );
};

const MARGIN = 15;

const SCALE_RATIO = 108 / 291;

const keyExtractor = (item: ProfileType | null) => item?.id ?? 'new';

export default forwardRef(HomeProfilesCarousel);

type ProfileType = ArrayItemType<HomeProfilesCarousel_user$data['profiles']>;

type ItemRenderProps = {
  index: number;
  item: ProfileType | null;
  coverWidth: number;
  coverHeight: number;
  scrollToIndex: (index: number) => void;
  currentUserIndex: number;
};

const ItemRenderComponent = ({
  index,
  currentUserIndex,
  item,
  coverWidth,
  coverHeight,
  scrollToIndex,
}: ItemRenderProps) => {
  const intl = useIntl();

  const onPress = (event: GestureResponderEvent) => {
    if (index !== currentUserIndex) {
      event.preventDefault();
      scrollToIndex(index);
    }
  };

  if (!item) {
    return (
      <Link route="NEW_PROFILE" prefetch>
        <PressableOpacity
          style={[
            styles.newCover,
            styles.coverShadow,
            {
              width: coverWidth,
              height: coverHeight,
              borderRadius: coverWidth * COVER_CARD_RADIUS,
            },
          ]}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Create a new profile',
            description: 'Start new profile creation from account screen',
          })}
        >
          <Icon icon="add" style={styles.icon} />
        </PressableOpacity>
      </Link>
    );
  }

  if (!item.cardCover) {
    return (
      <Link
        route="NEW_PROFILE"
        params={{
          profileId: item.id,
        }}
      >
        <PressableOpacity
          style={[
            styles.coverShadow,
            {
              width: coverWidth,
              height: coverHeight,
              borderRadius: coverWidth * COVER_CARD_RADIUS,
            },
          ]}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Create a new profile',
            description: 'Start new profile creation from account screen',
          })}
        >
          <CoverRenderer width={coverWidth} profile={item} />
        </PressableOpacity>
      </Link>
    );
  }

  return (
    <CoverLink
      profile={item}
      width={coverWidth}
      profileId={item.id}
      onPress={onPress}
      prefetch
      videoEnabled={currentUserIndex === index}
    />
  );
};

const ItemRender = memo(ItemRenderComponent);

const styles = StyleSheet.create({
  carousel: {
    flexGrow: 0,
    overflow: 'visible',
    alignSelf: 'center',
  },
  carouselContentContainer: {
    flexGrow: 0,
    overflow: 'visible',
  },
  newCover: {
    aspectRatio: COVER_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.white,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    tintColor: colors.white,
    width: 44,
    height: 44,
  },
  coverShadow: {
    ...shadow('light', 'bottom'),
  },
});
