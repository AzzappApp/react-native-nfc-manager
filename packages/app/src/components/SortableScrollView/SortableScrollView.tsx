import { useCallback } from 'react';
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
  id: string;
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
   * h-the height of the item
   *
   * @type {number}
   */
  itemHeight: number;
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
  visibleHeight?: number;
  /**
   * callback when the order change
   *
   */
  onChangeOrder: (items: T[]) => void;
};

/**
 * SortableList. Limitation is that all item should have the same height
 *
 * @return {*}
 */
const SortableList = <T extends SortableListItem>({
  itemHeight,
  items,
  renderItem,
  style,
  contentContainerStyle,
  visibleHeight,
  onChangeOrder,
  ...props
}: SortableListProps<T>) => {
  const positions = useSharedValue(arrayToObjectPosition(items));
  const scrollY = useSharedValue(0);
  const autoScroll = useSharedValue(ScrollDirection.None);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const dimensions = useWindowDimensions();

  const onDragEnd = useCallback(() => {
    onChangeOrder(
      items.map(item => {
        return {
          ...item,
          position: positions.get()[item.id],
        };
      }),
    );
  }, [items, onChangeOrder, positions]);

  useAnimatedReaction(
    () => scrollY.value,
    scrolling => {
      scrollTo(scrollViewRef, 0, scrolling, false);
    },
  );

  const handleScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const containerHeight = visibleHeight ?? dimensions.height;
  const contentHeight = items.length * itemHeight;

  return (
    <Animated.ScrollView
      ref={scrollViewRef}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      {...props}
      style={[styles.scrollViewStyle, style]}
      contentContainerStyle={[
        {
          height: contentHeight,
        },
        contentContainerStyle,
      ]}
    >
      {items.map(item => {
        return (
          <SortableWrapper
            key={item.id}
            id={item.id}
            positions={positions}
            lowerBound={scrollY}
            autoScrollDirection={autoScroll}
            itemCount={items.length}
            itemHeight={itemHeight}
            containerHeight={containerHeight}
            onDragEnd={onDragEnd}
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
    object[values[i].id] = i;
  }
  return object;
};

const styles = StyleSheet.create({
  scrollViewStyle: {
    flex: 1,
  },
});
