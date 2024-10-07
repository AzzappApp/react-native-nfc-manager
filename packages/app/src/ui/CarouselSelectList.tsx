import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  memo,
  useRef,
  useEffect,
} from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import useIsForeground from '#hooks/useIsForeground';
import type { ForwardedRef, ReactElement, ReactNode, Ref } from 'react';
import type {
  FlatList,
  ListRenderItem,
  StyleProp,
  ViewStyle,
  ViewProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ListRenderItemInfo,
} from 'react-native';
import type { GestureType } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

export type CarouselSelectListProps<TItem = any> = Omit<
  ViewProps,
  'children'
> & {
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
   * @see https://reactnative.dev/docs/virtualizedlist#onendreachedthreshold
   */
  onEndReachedThreshold?: number;
  /**
   * Shared value to track current profile index
   */
  currentProfileIndexSharedValue?: SharedValue<number>;
  /**
   * Callback called when the user scroll between two items, the index is rounded
   */
  onSelectedIndexChange?: (index: number) => void;
  /**
   * Imported from RN Flatlist doc
   * A marker property for telling the list to re-render (since it implements PureComponent).
   * If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop,
   * stick it here and treat it immutably.
   */
  extraData?: any | undefined;

  nativeGesture?: GestureType;
};

export type CarouselSelectListHandle = {
  /**
   * Scroll to the given index
   */
  scrollToIndex: (index: number, animated?: boolean) => void;
};

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
    extraData,
    currentProfileIndexSharedValue,
    onSelectedIndexChange,
    nativeGesture = Gesture.Native(),
    ...props
  }: CarouselSelectListProps<TItem>,
  ref: ForwardedRef<CarouselSelectListHandle>,
) {
  const listRef = useRef<FlatList>(null);

  const scrollIndex = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      listRef.current?.scrollToOffset({
        offset: index * itemWidth,
        animated,
      });
    },
  }));

  const isForeground = useIsForeground();
  const prevIsForeground = useRef(isForeground);

  useEffect(() => {
    if (isForeground !== prevIsForeground.current) {
      if (
        !prevIsForeground.current &&
        isForeground &&
        scrollIndex.value !== Math.round(scrollIndex.value)
      ) {
        listRef.current?.scrollToOffset({
          offset: Math.round(scrollIndex.value) * itemWidth,
          animated: false,
        });
      }

      prevIsForeground.current = isForeground;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForeground, itemWidth]);

  // Animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const index = event.contentOffset.x / itemWidth;
      scrollIndex.value = index;
      if (currentProfileIndexSharedValue) {
        currentProfileIndexSharedValue.value = index;
      }
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      'worklet';
      const index = event.nativeEvent.contentOffset.x / itemWidth;
      onSelectedIndexChange?.(Math.round(index));
      if (
        currentProfileIndexSharedValue &&
        currentProfileIndexSharedValue.value !== Math.round(index)
      ) {
        currentProfileIndexSharedValue.value = Math.round(index);
      }
    },
    [currentProfileIndexSharedValue, itemWidth, onSelectedIndexChange],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index,
    }),
    [itemWidth],
  );

  const offset = useMemo(
    () => (itemWidth - itemWidth * scaleRatio) / 2,
    [itemWidth, scaleRatio],
  );
  const offsetCenter = useMemo(
    () => (width - itemWidth) / 2 - itemWidth * scaleRatio,
    [itemWidth, scaleRatio, width],
  );
  const ccstyle = useMemo(() => {
    return [
      {
        paddingLeft: (width - itemWidth) / 2,
        paddingRight: (width - itemWidth) / 2,
        height,
      },
      contentContainerStyle,
    ];
  }, [contentContainerStyle, height, itemWidth, width]);

  const renderAnimatedItem = useCallback(
    (info: ListRenderItemInfo<TItem>) => {
      return (
        <AnimatedItem
          index={info.index}
          scrollIndex={scrollIndex}
          scaleRatio={scaleRatio}
          containerStyle={itemContainerStyle}
          offset={offset}
          offsetCenter={offsetCenter}
          width={itemWidth}
        >
          {renderItem(info)}
        </AnimatedItem>
      );
    },
    [
      scrollIndex,
      scaleRatio,
      itemContainerStyle,
      offset,
      offsetCenter,
      itemWidth,
      renderItem,
    ],
  );

  const computedStyle = useMemo(
    () => [{ width, height }, style as any],
    [height, style, width],
  );

  return (
    <GestureDetector gesture={nativeGesture}>
      <Animated.FlatList
        ref={listRef}
        data={data}
        horizontal
        renderItem={renderAnimatedItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        scrollEventThrottle={16}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        snapToAlignment="start"
        disableIntervalMomentum
        //removeClippedSubviews removing this to avoid blank (was use to improve perf)
        pagingEnabled
        bounces={false}
        onScroll={scrollHandler}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={computedStyle}
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialNumToRender={7}
        windowSize={11}
        maxToRenderPerBatch={11}
        extraData={extraData}
        contentContainerStyle={ccstyle}
        {...props}
      />
    </GestureDetector>
  );
}

export default memo(forwardRef(CarouselSelectList)) as <T>(
  p: CarouselSelectListProps<T> & { ref?: Ref<CarouselSelectListHandle> },
) => ReactElement;

const AnimatedItemWrapper = ({
  index,
  scrollIndex,
  scaleRatio,
  offset,
  offsetCenter,
  containerStyle,
  children,
  width,
}: {
  index: number;
  scrollIndex: SharedValue<number>;
  offset: number;
  offsetCenter: number;
  scaleRatio: number;
  children: ReactNode;
  containerStyle: StyleProp<ViewStyle>;
  width: number;
}) => {
  const translateX = useDerivedValue(() => {
    return interpolate(
      scrollIndex.value,
      [index - 1, index, index + 1],
      [-offset + offsetCenter / 2, 0, offset - offsetCenter / 2],
      Extrapolation.EXTEND,
    );
  });

  const scale = useDerivedValue(() => {
    return interpolate(
      scrollIndex.value,
      [index - 1, index, index + 1],
      [scaleRatio, 1, scaleRatio],
      Extrapolation.CLAMP,
    );
  });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      width,
      transform: [{ translateX: translateX.value }, { scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, containerStyle]}>
      {children}
    </Animated.View>
  );
};

const AnimatedItem = memo(AnimatedItemWrapper);
