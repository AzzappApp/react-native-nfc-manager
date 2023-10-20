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
import type { ForwardedRef, ReactElement, ReactNode, Ref } from 'react';
import type {
  ListRenderItem,
  StyleProp,
  ViewStyle,
  ViewProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ListRenderItemInfo,
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

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
  /**
   * Imported from RN Flatlist doc
   * A marker property for telling the list to re-render (since it implements PureComponent).
   * If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop,
   * stick it here and treat it immutably.
   */
  extraData?: any | undefined;
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
    extraData,
    onSelectedIndexChangeAnimated,
    onSelectedIndexChange,
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

  // Animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const index = event.contentOffset.x / itemWidth;
      scrollIndex.value = index;
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

  // const CellRenderer = useMemo(() => {
  //   const CellRenderer = ({
  //     index,
  //     children,
  //     style: _,
  //     ...props
  //   }: PropsWithChildren<{
  //     index: number;
  //     style: StyleProp<ViewStyle>;
  //   }>) => {};
  //   return CellRenderer;
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [itemWidth, scrollX, scaleRatio, width]);

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
      },
      contentContainerStyle,
    ];
  }, [contentContainerStyle, itemWidth, width]);

  const renderAnimatedItem = useCallback(
    (info: ListRenderItemInfo<TItem>) => {
      return (
        <AnimatedItemWrapper
          index={info.index}
          scrollIndex={scrollIndex}
          scaleRatio={scaleRatio}
          containerStyle={itemContainerStyle}
          offset={offset}
          offsetCenter={offsetCenter}
        >
          {renderItem(info)}
        </AnimatedItemWrapper>
      );
    },
    [
      scrollIndex,
      scaleRatio,
      itemContainerStyle,
      offset,
      offsetCenter,
      renderItem,
    ],
  );

  return (
    <AnimatedFlatList
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
      //removeClippedSubviews removing this to avoid blank (was use to improve perf)
      pagingEnabled
      bounces={false}
      onScroll={scrollHandler}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={[{ width, height }, style as any]}
      onMomentumScrollEnd={onMomentumScrollEnd}
      initialNumToRender={7}
      windowSize={11}
      maxToRenderPerBatch={11}
      extraData={extraData}
      contentContainerStyle={ccstyle}
      {...props}
    />
  );
}

export default forwardRef(CarouselSelectList) as <T>(
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
}: {
  index: number;
  scrollIndex: SharedValue<number>;
  offset: number;
  offsetCenter: number;
  scaleRatio: number;
  children: ReactNode;
  containerStyle: StyleProp<ViewStyle>;
}) => {
  const inputRange = [index - 1, index, index + 1];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollIndex.value,
      inputRange,
      [scaleRatio, 1, scaleRatio],
      Extrapolate.CLAMP,
    );
    const translateX = interpolate(
      scrollIndex.value,
      inputRange,
      [-offset + offsetCenter / 2, 0, offset - offsetCenter / 2],
      Extrapolate.EXTEND,
    );

    return {
      transform: [{ translateX }, { scale }],
    };
  });
  return (
    <Animated.View style={[animatedStyle, containerStyle]} key={index}>
      {children}
    </Animated.View>
  );
};
