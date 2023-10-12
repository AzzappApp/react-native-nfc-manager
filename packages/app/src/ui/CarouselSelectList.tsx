import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { FlatList } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { ForwardedRef, PropsWithChildren, ReactElement, Ref } from 'react';
import type {
  ListRenderItem,
  StyleProp,
  ViewStyle,
  ViewProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

type CarouselSelectListProps<TItem = any> = Omit<ViewProps, 'children'> & {
  /**
   * The data to display
   */
  data: readonly TItem[];
  /**
   * @see https://reactnative.dev/docs/flatlist#keyextractor
   */
  keyExtractor: (item: TItem, index: number) => string;
  /**
   * @see https://reactnative.dev/docs/flatlist#renderitem
   */
  renderItem: ListRenderItem<TItem>;
  /**
   * The width of the carousel
   */
  width: number;
  /**
   * The height of the carousel
   */
  height: number;
  /**
   * The width of an item
   */
  itemWidth: number;
  /**
   * the index of the item to display first
   */
  initialScrollIndex?: number;
  /**
   * Style of the cell around each rendered item
   */
  itemContainerStyle?: StyleProp<ViewStyle>;
  /**
   * @see https://reactnative.dev/docs/scrollview#contentcontainerstyle
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * The scale ratio of the item on the side
   */
  scaleRatio: number;
  /**
   * Callback when the user scroll to the end of the list
   */
  onEndReached?: () => void;
  /**
   * Callback called when the user scroll between two items, the index is not rounded
   * To allows synchroneous animation.
   * This callback is called on the UI thread (and should be a worklet)
   */
  onSelectedIndexChangeAnimated?: (index: number) => void;
  /**
   * Callback called when the user scroll between two items, the index is rounded
   */
  onSelectedIndexChange?: (index: number) => void;
};

export type CarouselSelectListHandle = {
  /**
   * Scroll to the given index
   */
  scrollToIndex: (index: number, animated?: boolean) => void;
};

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList,
) as unknown as typeof FlatList;

/**
 * Render a list of items displayed in a carousel
 */
function CarouselSelectList<TItem = any>(
  {
    data,
    keyExtractor,
    renderItem,
    width,
    height,
    itemWidth,
    style,
    itemContainerStyle,
    contentContainerStyle,
    scaleRatio,
    onSelectedIndexChangeAnimated,
    onSelectedIndexChange,
    ...props
  }: CarouselSelectListProps<TItem>,
  ref: ForwardedRef<CarouselSelectListHandle>,
) {
  const listRef = useRef<FlatList>(null);

  const scrollX = useSharedValue(0);

  const onSelectIndexChangeInner = useMemo(() => {
    let lastIndex = -1;
    return (index: number) => {
      if (index === lastIndex) {
        return;
      }
      lastIndex = index;
      onSelectedIndexChange?.(index);
    };
  }, [onSelectedIndexChange]);

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      listRef.current?.scrollToOffset({
        offset: index * itemWidth,
        animated,
      });
    },
  }));

  // Animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
      const index = event.contentOffset.x / itemWidth;
      onSelectedIndexChangeAnimated?.(index);
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = event.nativeEvent.contentOffset.x / itemWidth;
      onSelectedIndexChange?.(Math.round(index));
    },
    [itemWidth, onSelectedIndexChange],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index,
    }),
    [itemWidth],
  );

  const onScrollEnd = useCallback(() => {
    onSelectIndexChangeInner(Math.round(scrollX.value / itemWidth));
  }, [onSelectIndexChangeInner, scrollX, itemWidth]);

  const CellRenderer = useMemo(() => {
    const CellRenderer = ({
      index,
      children,
      style: _,
      ...props
    }: PropsWithChildren<{
      index: number;
      style: StyleProp<ViewStyle>;
    }>) => {
      const inputRange = [index - 1, index, index + 1];
      const offset = (itemWidth - itemWidth * scaleRatio) / 2;
      const offetCenter = (width - itemWidth) / 2 - itemWidth * scaleRatio;

      const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(
          scrollX.value / itemWidth,
          inputRange,
          [scaleRatio, 1, scaleRatio],
          Extrapolate.CLAMP,
        );
        const translateX = interpolate(
          scrollX.value / itemWidth,
          [index - 1, index, index + 1],
          [-offset + offetCenter / 2, 0, offset - offetCenter / 2],
          Extrapolate.EXTEND,
        );

        return {
          transform: [{ translateX }, { scale }],
        };
      }, [scrollX]);

      return (
        <Animated.View
          style={[animatedStyle, itemContainerStyle]}
          key={index}
          {...props}
        >
          {children}
        </Animated.View>
      );
    };
    return CellRenderer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemWidth, scrollX, scaleRatio, width]);

  return (
    <AnimatedFlatList
      ref={listRef}
      data={data}
      horizontal
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      CellRendererComponent={CellRenderer}
      scrollEventThrottle={16}
      snapToInterval={itemWidth}
      decelerationRate="fast"
      snapToAlignment="start"
      //removeClippedSubviews removing this to avoid blank (was use to improve perf)
      pagingEnabled
      bounces={false}
      onScroll={scrollHandler}
      onScrollAnimationEnd={onScrollEnd}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={[{ width, height }, style as any]}
      onMomentumScrollEnd={onMomentumScrollEnd}
      initialNumToRender={3}
      windowSize={21}
      maxToRenderPerBatch={21}
      contentContainerStyle={[
        {
          height,
          alignItems: 'center',
          paddingLeft: (width - itemWidth) / 2,
          paddingRight: (width - itemWidth) / 2,
        },
        contentContainerStyle,
      ]}
      {...props}
    />
  );
}

export default forwardRef(CarouselSelectList) as <T>(
  p: CarouselSelectListProps<T> & { ref?: Ref<CarouselSelectListHandle> },
) => ReactElement;
