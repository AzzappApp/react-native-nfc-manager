import isEqual from 'lodash/isEqual';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  memo,
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
} from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import useIsForeground from '#hooks/useIsForeground';
import type { ForwardedRef, ReactElement, Ref } from 'react';
import type {
  StyleProp,
  ViewStyle,
  ViewProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ListRenderItemInfo,
  FlatList,
  LayoutChangeEvent,
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export type CarouselSelectListRenderItemInfo<ItemT> =
  ListRenderItemInfo<ItemT> & {
    width: number;
    height: number;
  };

export type CarouselSelectListRenderItem<ItemT> = (
  info: CarouselSelectListRenderItemInfo<ItemT>,
) => React.ReactElement | null;

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
  renderItem: CarouselSelectListRenderItem<TItem>;
  /**
   * The aspect ratio of the item
   */
  itemRatio: number;
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

  /**
   * @param width new width of carousel item
   */
  onItemWidthUpdated?: (width: number) => void;
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
    itemRatio,
    style,
    itemContainerStyle,
    contentContainerStyle,
    scaleRatio,
    extraData,
    currentProfileIndexSharedValue,
    onSelectedIndexChange,
    onItemWidthUpdated,
    ...props
  }: CarouselSelectListProps<TItem>,
  ref: ForwardedRef<CarouselSelectListHandle>,
) {
  const scrollIndex = useSharedValue(props.initialScrollIndex ?? 0);

  const containerRef = useRef<View | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const itemWidth =
    containerHeight != null
      ? PixelRatio.roundToNearestPixel(containerHeight * itemRatio)
      : null;

  useLayoutEffect(() => {
    if (!containerRef.current) {
      console.warn('CarouselSelectList : containerRef.value is null');
    }
    containerRef.current?.measureInWindow((_x, _y, width, height) => {
      //on first render android might return 0 for height and width ... so we need to wait for the next render
      if (height !== 0 && width !== 0) {
        setContainerHeight(height);
        setContainerWidth(width);
        onItemWidthUpdated?.(
          PixelRatio.roundToNearestPixel(height * itemRatio),
        );
      }
    });
  }, [itemRatio, onItemWidthUpdated]);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { height, width } = e.nativeEvent.layout;
      //on first render android might return 0 for height and width ... so we need to wait for the next render
      if (height !== 0 && width !== 0) {
        setContainerHeight(height);
        setContainerWidth(width);
        onItemWidthUpdated?.(
          PixelRatio.roundToNearestPixel(height * itemRatio),
        );
      }
    },
    [itemRatio, onItemWidthUpdated],
  );

  const listRef = useRef<FlatList>(null);
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index: number, animated = true) => {
        if (itemWidth == null) {
          return;
        }
        if (!animated) {
          scrollIndex.set(index);
        }
        listRef.current?.scrollToOffset({
          offset: index * itemWidth,
          animated,
        });
      },
    }),
    [itemWidth, scrollIndex],
  );

  useEffect(() => {
    if (itemWidth != null) {
      listRef.current?.scrollToOffset({
        offset: scrollIndex.value * itemWidth,
        animated: false,
      });
    }
  }, [itemWidth, scrollIndex]);

  const isForeground = useIsForeground();
  const prevIsForeground = useRef(isForeground);

  useEffect(() => {
    if (isForeground !== prevIsForeground.current && itemWidth != null) {
      const scrollIndexValue = scrollIndex.get();
      if (
        !prevIsForeground.current &&
        isForeground &&
        scrollIndexValue !== Math.round(scrollIndexValue)
      ) {
        listRef.current?.scrollToOffset({
          offset: Math.round(scrollIndexValue) * itemWidth,
          animated: false,
        });
      }

      prevIsForeground.current = isForeground;
    }
  }, [isForeground, itemWidth, scrollIndex]);

  // Animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (itemWidth == null) {
        return;
      }
      const index = event.contentOffset.x / itemWidth;
      scrollIndex.set(index);
      if (currentProfileIndexSharedValue) {
        currentProfileIndexSharedValue.set(index);
      }
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      'worklet';
      const index = event.nativeEvent.contentOffset.x / itemWidth!;
      onSelectedIndexChange?.(Math.round(index));
      if (
        currentProfileIndexSharedValue &&
        currentProfileIndexSharedValue.value !== Math.round(index)
      ) {
        currentProfileIndexSharedValue.set(Math.round(index));
      }
    },
    [currentProfileIndexSharedValue, itemWidth, onSelectedIndexChange],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: itemWidth!,
      offset: itemWidth! * index,
      index,
    }),
    [itemWidth],
  );

  const ccstyle = useMemo(() => {
    return [
      {
        paddingLeft: (containerWidth! - itemWidth!) / 2,
        paddingRight: (containerWidth! - itemWidth!) / 2,
        height: containerHeight,
      },
      contentContainerStyle,
    ];
  }, [itemWidth, containerWidth, containerHeight, contentContainerStyle]);

  const renderAnimatedItem = useCallback(
    (info: ListRenderItemInfo<TItem>) => {
      return (
        <AnimatedItem
          index={info.index}
          scrollIndex={scrollIndex}
          scaleRatio={scaleRatio}
          containerStyle={itemContainerStyle}
          width={itemWidth ?? 0}
          height={containerHeight ?? 0}
          renderChildren={renderItem}
          info={info}
          containerWidth={containerWidth ?? 0}
        />
      );
    },
    [
      scrollIndex,
      scaleRatio,
      itemContainerStyle,
      itemWidth,
      containerHeight,
      renderItem,
      containerWidth,
    ],
  );

  return (
    <View ref={containerRef} style={style} onLayout={onLayout}>
      {itemWidth != null && (
        <Animated.FlatList
          ref={listRef}
          data={data}
          horizontal
          renderItem={renderAnimatedItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          scrollEventThrottle={16}
          snapToInterval={itemWidth ?? undefined}
          decelerationRate="fast"
          snapToAlignment="start"
          disableIntervalMomentum
          //removeClippedSubviews removing this to avoid blank (was use to improve perf)
          pagingEnabled
          bounces={false}
          onScroll={scrollHandler}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          onMomentumScrollEnd={onMomentumScrollEnd}
          initialNumToRender={7}
          windowSize={11}
          maxToRenderPerBatch={11}
          extraData={extraData}
          contentContainerStyle={ccstyle}
          {...props}
        />
      )}
    </View>
  );
}

export default memo(forwardRef(CarouselSelectList)) as <T>(
  p: CarouselSelectListProps<T> & { ref?: Ref<CarouselSelectListHandle> },
) => ReactElement;

const styles = StyleSheet.create({ list: { flex: 1, overflow: 'visible' } });

const AnimatedItemWrapper = ({
  index,
  scrollIndex,
  scaleRatio,
  containerStyle,
  renderChildren,
  info,
  width,
  height,
  containerWidth,
}: {
  index: number;
  scrollIndex: SharedValue<number>;
  scaleRatio: number;
  renderChildren: CarouselSelectListRenderItem<any>;
  info: ListRenderItemInfo<any>;
  containerStyle: StyleProp<ViewStyle>;
  width: number;
  height: number;
  containerWidth: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const offset = (width - width * scaleRatio) / 2;
    const offsetCenter = (containerWidth - width) / 2 - width * scaleRatio;
    const translateX = interpolate(
      scrollIndex.value,
      [index - 1, index, index + 1],
      [-offset + offsetCenter / 2, 0, offset - offsetCenter / 2],
      Extrapolation.EXTEND,
    );

    const scale = interpolate(
      scrollIndex.value,
      [index - 1, index, index + 1],
      [scaleRatio, 1, scaleRatio],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateX }, { scale }],
    };
  });
  return (
    <Animated.View style={[{ width }, animatedStyle, containerStyle]}>
      {renderChildren({ ...info, width, height })}
    </Animated.View>
  );
};

const AnimatedItem = memo(AnimatedItemWrapper, (prev, next) =>
  isEqual(prev, next),
);
