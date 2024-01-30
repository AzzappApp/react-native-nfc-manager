import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  memo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import IconButton from './IconButton';
import type {
  CarouselSelectListProps,
  CarouselSelectListHandle,
} from './CarouselSelectList';
import type { ForwardedRef, ReactElement, Ref } from 'react';
import type {
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

/**
 * Render a list of items displayed in a carousel
 */
function SimpleCarouselSelectList<TItem = any>(
  {
    data,
    keyExtractor,
    renderItem,
    width,
    height,
    itemWidth: _,
    style,
    itemContainerStyle,
    contentContainerStyle,
    scaleRatio,
    extraData,
    currentProfileIndexSharedValue,
    onSelectedIndexChange,
    ...props
  }: CarouselSelectListProps<TItem>,
  ref: ForwardedRef<CarouselSelectListHandle>,
) {
  const listRef = useRef<FlatList>(null);

  const scrollIndex = useSharedValue(0);
  const selectedIndexRef = useRef(0);

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      listRef.current?.scrollToOffset({
        offset: index * width,
        animated,
      });
    },
  }));

  const onPrevious = useCallback(() => {
    if (selectedIndexRef.current <= 0) {
      return;
    }
    selectedIndexRef.current--;
    listRef.current?.scrollToOffset({
      offset: selectedIndexRef.current * width,
      animated: true,
    });
    onSelectedIndexChange?.(selectedIndexRef.current);
  }, [onSelectedIndexChange, width]);

  const onNext = useCallback(() => {
    if (selectedIndexRef.current >= data.length - 1) {
      return;
    }
    selectedIndexRef.current++;
    listRef.current?.scrollToOffset({
      offset: selectedIndexRef.current * width,
      animated: true,
    });
    onSelectedIndexChange?.(selectedIndexRef.current);
  }, [data.length, width, onSelectedIndexChange]);

  // Animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const index = event.contentOffset.x / width;
      scrollIndex.value = index;
      if (currentProfileIndexSharedValue) {
        currentProfileIndexSharedValue.value = index;
      }
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = event.nativeEvent.contentOffset.x / width;
      selectedIndexRef.current = Math.round(index);
      onSelectedIndexChange?.(Math.round(index));
    },
    [width, onSelectedIndexChange],
  );

  const renderItemInner = useCallback(
    (info: ListRenderItemInfo<TItem>) => {
      return (
        <View style={{ width, alignItems: 'center', justifyContent: 'center' }}>
          {renderItem(info)}
        </View>
      );
    },
    [width, renderItem],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const ccstyle = useMemo(() => {
    return [
      {
        height,
      },
      contentContainerStyle,
    ];
  }, [contentContainerStyle, height]);

  const containerStyle = useMemo(
    () => [{ width, height }, style],
    [height, style, width],
  );
  const carouselStyle = useMemo(() => [{ width, height }], [height, width]);

  const previousButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.min(scrollIndex.value, 1),
    };
  });

  const nextButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.min(data.length - scrollIndex.value - 1, 1),
    };
  });

  return (
    <View style={containerStyle}>
      <Animated.FlatList
        ref={listRef}
        data={data}
        horizontal
        renderItem={renderItemInner}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        scrollEventThrottle={16}
        snapToInterval={width}
        decelerationRate="fast"
        snapToAlignment="start"
        disableIntervalMomentum
        pagingEnabled
        bounces={false}
        onScroll={scrollHandler}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={carouselStyle}
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialNumToRender={5}
        windowSize={5}
        maxToRenderPerBatch={5}
        extraData={extraData}
        contentContainerStyle={ccstyle}
        {...props}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <IconButton
          icon="arrow_left"
          variant="icon"
          style={previousButtonAnimatedStyle}
          onPress={onPrevious}
        />
        <IconButton
          icon="arrow_right"
          variant="icon"
          style={nextButtonAnimatedStyle}
          onPress={onNext}
        />
      </View>
    </View>
  );
}

export default memo(forwardRef(SimpleCarouselSelectList)) as <T>(
  p: CarouselSelectListProps<T> & { ref?: Ref<CarouselSelectListHandle> },
) => ReactElement;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
});
