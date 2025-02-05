import React, { useCallback, useEffect, useRef } from 'react';
import Animated, { runOnJS } from 'react-native-reanimated';
import type { RefObject } from 'react';
import type {
  NativeSyntheticEvent,
  NativeScrollEvent,
  FlatListProps,
} from 'react-native';

type CircularFlatListProps<T> = Omit<FlatListProps<T>, 'data'> & {
  data: T[];
  itemSize: number;
  onMomentumScrollEnd?: (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => void;
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  keyExtractor?: (item: T, index: number) => string;
  listRef: RefObject<Animated.FlatList<T> | null>;
};

function CircularFlatList<T>({
  data,
  itemSize,
  horizontal = false,
  onMomentumScrollEnd,
  onScrollEndDrag,
  keyExtractor = (_, index) => `${index}`,
  listRef,
  ...props
}: CircularFlatListProps<T>) {
  const innerListRef = useRef<Animated.FlatList<T>>(null);

  const usedListRef = listRef || innerListRef;

  // Duplicate the data for circular behavior
  const circularData = [...data, ...data, ...data];

  const scrollToIndex = useCallback(
    (index: number) => {
      if (usedListRef.current) {
        usedListRef.current.scrollToOffset({
          offset: index * itemSize,
          animated: false,
        });
      }
    },
    [itemSize, usedListRef],
  );

  // Scroll to the middle index on mount
  useEffect(() => {
    scrollToIndex(data.length + 1);
  }, [data.length, scrollToIndex]);

  // Default edge-handling logic
  const defaultHandleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offset = horizontal
      ? event.nativeEvent.contentOffset.x
      : event.nativeEvent.contentOffset.y;

    const currentIndex = Math.round(offset / itemSize);

    // Reset position to the middle for seamless scrolling
    if (currentIndex <= data.length - 1) {
      const newIndex = currentIndex + data.length;
      if (usedListRef.current) {
        runOnJS((idx: number) => {
          scrollToIndex(idx);
        })(newIndex);
      }
    } else if (currentIndex >= 2 * data.length + 1) {
      const newIndex = currentIndex - data.length;
      if (usedListRef.current) {
        runOnJS((idx: number) => {
          scrollToIndex(idx);
        })(newIndex);
      }
    }
  };

  const onMomentumScrollEndInner = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    defaultHandleScrollEnd(event);
    onMomentumScrollEnd?.(event);
  };

  const onScrollEndDragInner = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    defaultHandleScrollEnd(event);
    onScrollEndDrag?.(event);
  };

  return (
    <Animated.FlatList
      {...props}
      ref={usedListRef}
      data={circularData}
      horizontal={horizontal}
      keyExtractor={keyExtractor} // Use the provided or default keyExtractor
      onMomentumScrollEnd={onMomentumScrollEndInner}
      onScrollEndDrag={onScrollEndDragInner}
      // Explicitly handle CellRendererComponent as undefined
      CellRendererComponent={undefined}
    />
  );
}

export default CircularFlatList;
