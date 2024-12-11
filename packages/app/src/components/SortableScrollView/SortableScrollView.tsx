import { useCallback, useEffect } from 'react';
import { useWindowDimensions, StyleSheet } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { ScrollDirection } from './SortableListHelper';
import SortableWrapper from './SortableWrapper';
import type { ScrollViewProps } from 'react-native';
import type { PanGesture } from 'react-native-gesture-handler';

export type SortableListItem = {
  keyId: string;
  position: number;
};
export type SortableListProps<T extends SortableListItem> = ScrollViewProps & {
  /**
   * The array of item should at least have an id and a position
   *
   * @type {T[]}
   */
  items: T[];
  /**
   * the height or width of the item
   *
   * @type {number}
   */
  itemDimension: number;
  /**
   * Methd to render the item. The panGesture is optional and have to be applied on the area use to drop and drop the image
   * otherwise there will be a conflict with the scrollview
   *
   */
  renderItem: (item: T, panGesture: PanGesture) => React.ReactNode;
  /**
   * the area visible of the scrollView content (calculate when to scrolldown)
   *
   * @type {number}
   */
  visibleDimension?: number;
  /**
   * callback when the order change
   *
   */
  onChangeOrder: (items: T[]) => void;

  /**
   * Need a long press to activate drag & drop
   */
  activateAfterLongPress?: boolean;

  /**
   * Indicates if scrollList is horizontal
   */
  horizontal?: boolean;
};

/**
 * SortableList. Limitation is that all item should have the same height
 *
 * @return {*}
 */
const SortableList = <T extends SortableListItem>({
  itemDimension,
  items,
  renderItem,
  style,
  contentContainerStyle,
  visibleDimension,
  onChangeOrder,
  horizontal,
  activateAfterLongPress,
  ...props
}: SortableListProps<T>) => {
  const objectPosition = arrayToObjectPosition(items);
  const positions = useSharedValue(objectPosition);
  const scroll = useSharedValue(0);
  const autoScroll = useSharedValue(ScrollDirection.None);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const dimensions = useWindowDimensions();

  useEffect(() => {
    positions.value = arrayToObjectPosition(items);
  }, [items, positions]);

  const onDragEnd = useCallback(() => {
    onChangeOrder(
      items.map(item => {
        return {
          ...item,
          position: positions.get()[item.keyId],
        };
      }),
    );
  }, [items, onChangeOrder, positions]);

  useAnimatedReaction(
    () => scroll.value,
    scrolling => {
      scrollTo(
        scrollViewRef,
        horizontal ? scrolling : 0,
        scrolling ? 0 : scrolling,
        false,
      );
    },
  );

  const handleScroll = useAnimatedScrollHandler(event => {
    scroll.value = horizontal ? event.contentOffset.x : event.contentOffset.y;
  });

  const containerDimension =
    visibleDimension ?? (horizontal ? dimensions.width : dimensions.height);
  const contentDimension = items.length * itemDimension;

  return (
    <Animated.ScrollView
      ref={scrollViewRef}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      {...props}
      horizontal={horizontal}
      style={[styles.scrollViewStyle, style]}
      contentContainerStyle={[
        {
          width: horizontal ? contentDimension : undefined,
          height: horizontal ? undefined : contentDimension,
          left:
            contentDimension < containerDimension
              ? (containerDimension - contentDimension) / 2
              : 0,
        },
        contentContainerStyle,
      ]}
    >
      {items.map(item => {
        const initialPosition = objectPosition[item.keyId] * itemDimension;
        return (
          <SortableWrapper
            key={item.keyId}
            id={item.keyId}
            positions={positions}
            lowerBound={scroll}
            autoScrollDirection={autoScroll}
            itemCount={items.length}
            itemDimension={itemDimension}
            containerDimension={containerDimension}
            onDragEnd={onDragEnd}
            horizontal={horizontal}
            activateAfterLongPress={activateAfterLongPress}
            initialPosition={initialPosition}
          >
            {panGesture => {
              return renderItem(item, panGesture);
            }}
          </SortableWrapper>
        );
      })}
    </Animated.ScrollView>
  );
};
export default SortableList;

export const arrayToObjectPosition = <T extends SortableListItem>(
  array: T[],
) => {
  const values = Object.values(array);
  const object: { [id: string]: number } = {};

  for (let i = 0; i < values.length; i++) {
    object[values[i].keyId] = i;
  }
  return object;
};

const styles = StyleSheet.create({
  scrollViewStyle: {
    flex: 1,
  },
});
