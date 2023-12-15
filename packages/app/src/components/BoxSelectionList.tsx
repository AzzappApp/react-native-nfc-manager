import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAnimatedState from '#hooks/useAnimatedState';
import PressableNative from '#ui/PressableNative';
import type {
  LayoutChangeEvent,
  ListRenderItemInfo,
  ViewProps,
} from 'react-native';

export type BoxButtonItemInfo<T> = {
  item: T | null;
  index: number;
  width: number;
  height: number;
};

export type BoxSelectionListProps<T> = ViewProps & {
  data: readonly T[];
  selectedItem: T | null;
  imageRatio?: number;
  renderItem: (params: BoxButtonItemInfo<T>) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onSelect: (item: T | null) => void;
};

const BoxSelectionList = <T,>({
  data,
  selectedItem,
  imageRatio = COVER_RATIO,
  renderItem,
  keyExtractor,
  onSelect,
  onLayout,
  ...props
}: BoxSelectionListProps<T>) => {
  const styles = useStyleSheet(styleSheet);

  const [height, setHeight] = useState<number | null>(null);

  const onLayoutInner = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      setHeight(height);
      onLayout?.(event);
    },
    [onLayout],
  );

  const renderAnimationButton = useCallback(
    ({ item, index }: ListRenderItemInfo<T | null>) => {
      if (height === null) {
        return null;
      }
      return (
        <BoxButtonMemo
          item={item}
          index={index}
          renderItem={renderItem}
          imageRatio={imageRatio}
          // eslint-disable-next-line eqeqeq
          isSelected={selectedItem == item}
          height={height - VERTICAL_PADDING * 2}
          onSelect={onSelect}
          {...props}
        />
      );
    },
    [renderItem, imageRatio, selectedItem, height, onSelect, props],
  );

  const width = (height ?? 0) * COVER_RATIO;

  const getItemLayout = useCallback(
    (_data: any, index: number) => {
      return {
        length: width + 10,
        offset: (width + 10) * index,
        index,
      };
    },
    [width],
  );

  const innerKeyExtractor = useCallback(
    (item: T | null) => (item ? keyExtractor(item) : `first-item`),
    [keyExtractor],
  );

  const innerData = useMemo(
    () => (height === null ? [] : [null, ...data]),
    [data, height],
  );

  const contentInset = useRef({ left: 30 }).current;
  const contentOffset = useRef({ x: -30, y: 0 }).current;

  return (
    <FlatList
      {...props}
      data={innerData}
      renderItem={renderAnimationButton}
      getItemLayout={getItemLayout}
      keyExtractor={innerKeyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.animationListContentContainer}
      ItemSeparatorComponent={ItemSeparatorComponent}
      contentInset={contentInset}
      contentOffset={contentOffset}
      maxToRenderPerBatch={2}
      onLayout={onLayoutInner}
    />
  );
};

export default BoxSelectionList;

type BoxButtonProps<T> = {
  item: T | null;
  index: number;
  renderItem: (params: BoxButtonItemInfo<T>) => React.ReactNode;
  isSelected: boolean;
  height: number;
  imageRatio: number;
  onSelect: (item: T | null) => void;
};

const BoxButton = <T,>({
  item,
  index,
  isSelected,
  height,
  imageRatio,
  onSelect,
  renderItem,
}: BoxButtonProps<T>) => {
  const timing = useAnimatedState(isSelected, { duration: 120 });

  const itemAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(timing.value, [0, 1], [1, 1.1]) }],
    };
  }, [height, timing]);

  const width = height * imageRatio;

  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    onSelect(item);
  }, [onSelect, item]);

  return (
    <Animated.View
      style={[
        {
          height,
          aspectRatio: imageRatio,
        },
        itemAnimatedStyle,
      ]}
    >
      <PressableNative
        style={[
          styles.animationButton,
          {
            borderRadius: width * COVER_CARD_RADIUS,
          },
        ]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View
          style={[
            {
              borderRadius: width * COVER_CARD_RADIUS,
              overflow: 'hidden',
              aspectRatio: COVER_RATIO,
            },
          ]}
        >
          {renderItem({ item, index, width, height })}
        </View>
      </PressableNative>
    </Animated.View>
  );
};

const BoxButtonMemo: <T>(props: BoxButtonProps<T>) => React.ReactNode = memo(
  BoxButton,
) as any;

const ItemSeparatorComponent = () =>
  useMemo(() => <View style={{ width: 10 }} />, []);

const VERTICAL_PADDING = 15;

const styleSheet = createStyleSheet(appearance => ({
  animationListContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: VERTICAL_PADDING,
  },
  animationButton: [
    {
      flex: 1,
      overflow: 'visible',
      backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey200,
    },
    shadow(appearance),
  ],
}));
