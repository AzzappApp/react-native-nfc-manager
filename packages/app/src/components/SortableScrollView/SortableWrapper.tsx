import { useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { trigger } from 'react-native-haptic-feedback';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { ScrollDirection, objectMove } from './SortableListHelper';
import type { PanGesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

type SortableWrapperProps = {
  /**
   * thei unique id of the time wrapped
   *
   * @type {string}
   */
  id: string;
  /**
   * Render prop that will be called with an animated Pan gesture
   */
  children: (panGesture: PanGesture) => React.ReactNode;
  /**
   * the total height of the container
   *
   * @type {number}
   */
  containerHeight: number;
  /**
   * Sahre value array of id: position
   *
   * @type {SharedValue<{ [id: string]: number }>}
   */
  positions: SharedValue<{ [id: string]: number }>;
  /**
   * the lowerbound
   *
   * @type {SharedValue<number>}
   */
  lowerBound: SharedValue<number>;
  /**
   * the direction of the scroll (used to move item while scrolling)
   *
   * @type {SharedValue<ScrollDirection>}
   */
  autoScrollDirection: SharedValue<ScrollDirection>;
  /**
   * the height of the item (important to calculate the position)
   *
   * @type {number}
   */
  itemHeight: number;
  /**
   * the number of item in the list
   *
   * @type {number}
   */
  itemCount: number;
  /**
   * callback when the drag end
   * @type {() => void}
   */
  onDragEnd: () => void;
};
/**
 *  SortableWrapper for sortable list. Multiple part were inspired from diff gist
 *  Could have maybe written using a HOC
 */
const SortableWrapper = ({
  id,
  children,
  positions,
  containerHeight,
  lowerBound,
  autoScrollDirection,
  itemCount,
  itemHeight,
  onDragEnd,
}: SortableWrapperProps) => {
  const styles = useStyleSheet(styleSheet);
  const [moving, setMoving] = useState(false);
  const positionY = useSharedValue(positions.get()[id] * itemHeight);
  const top = useSharedValue(positions.get()[id] * itemHeight);
  const upperBound = useDerivedValue(() => lowerBound.get() + containerHeight);
  const targetLowerBound = useSharedValue(lowerBound.get());
  const diffScrolling = useSharedValue(0);

  // move the position of the row
  useAnimatedReaction(
    () => positionY.value,
    (positionYValue, previousValue) => {
      if (
        positionYValue !== null &&
        previousValue !== null &&
        positionYValue !== previousValue
      ) {
        if (moving) {
          top.value = positionYValue;
          setPosition(positionYValue, itemCount, positions, id, itemHeight);
          setAutoScroll(
            positionYValue,
            lowerBound.value,
            upperBound.value,
            itemHeight,
            autoScrollDirection,
          );
        }
      }
    },
  );

  // If another item is moving and changes this ones position, move to new position.
  useAnimatedReaction(
    () => positions.value[id],
    (currentPosition, previousPosition) => {
      if (
        currentPosition !== null &&
        previousPosition !== null &&
        currentPosition !== previousPosition
      ) {
        //does not apply to the current moving item, but other
        if (!moving) {
          top.value = withSpring(currentPosition * itemHeight);
        }
      }
    },
    [moving],
  );

  // determine the difference induce by scrolling while moving to adjust the position of the item
  useAnimatedReaction(
    () => lowerBound.value,
    (currentLowerBound, previousLowerBound) => {
      if (
        currentLowerBound !== null &&
        previousLowerBound !== null &&
        currentLowerBound !== previousLowerBound &&
        moving
      ) {
        const diff = previousLowerBound - currentLowerBound;
        diffScrolling.value += diff;
      }
    },
    [moving],
  );

  // // When the autoScrollDirection changes, set the target lower bound with timing.
  useAnimatedReaction(
    () => autoScrollDirection.value,
    (scrollDirection, previousValue) => {
      if (
        scrollDirection !== null &&
        previousValue !== null &&
        scrollDirection !== previousValue
      ) {
        switch (scrollDirection) {
          case ScrollDirection.Up: {
            targetLowerBound.value = lowerBound.value;
            targetLowerBound.value = withTiming(0, { duration: 1500 });
            break;
          }
          case ScrollDirection.Down: {
            const contentHeight = itemCount * itemHeight;
            const maxScroll = contentHeight - containerHeight + 300;

            targetLowerBound.value = lowerBound.value;
            targetLowerBound.value = withTiming(maxScroll, { duration: 1500 });
            break;
          }
          case ScrollDirection.None: {
            targetLowerBound.value = lowerBound.value;
            break;
          }
        }
      }
    },
  );

  // When the target lower bound changes, update the lower bound value.
  useAnimatedReaction(
    () => targetLowerBound.value,
    (targetLowerBoundValue, previousValue) => {
      if (
        targetLowerBoundValue !== null &&
        previousValue !== null &&
        targetLowerBoundValue !== previousValue
      ) {
        if (moving) {
          lowerBound.value = targetLowerBoundValue;
        }
      }
    },
  );
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      positionY.value = positions.value[id] * itemHeight;
      startY.value = positions.value[id] * itemHeight;
      runOnJS(setMoving)(true);
      runOnJS(trigger)('impactLight');
    })
    .onUpdate(event => {
      positionY.value = startY.value + event.translationY - diffScrolling.value;
    })
    .onEnd(() => {
      const finishPosition = positions.value[id] * itemHeight;
      top.value = withTiming(finishPosition);
      diffScrolling.value = 0;
    })
    .onFinalize(() => {
      runOnJS(setMoving)(false);
      runOnJS(onDragEnd)();
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      top: top.value,
      zIndex: moving ? 1 : 0,
      shadowOpacity: withSpring(moving ? 0.2 : 0),
    };
  });

  return (
    <Animated.View style={[styles.root, animatedStyle]}>
      {children(panGesture)}
    </Animated.View>
  );
};

export default SortableWrapper;

const styleSheet = createStyleSheet(appearance => ({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    ...shadow(appearance, 'center'),
  },
}));

function setPosition(
  positionY: number,
  count: number,
  positions: SharedValue<{ [id: string]: number }>,
  id: string,
  itemHeight: number,
) {
  'worklet';
  const newPosition = Math.max(
    0,
    Math.min(Math.round(positionY / itemHeight), count - 1),
  );

  if (newPosition !== positions.value[id]) {
    positions.value = objectMove(
      positions.value,
      positions.value[id],
      newPosition,
    );
    // make a haptic effect on change (to make design like me)
    runOnJS(trigger)('impactLight');
  }
}

function setAutoScroll(
  positionY: number,
  lowerBound: number,
  upperBound: number,
  scrollThreshold: number,
  autoScroll: SharedValue<ScrollDirection>,
) {
  'worklet';
  if (positionY <= lowerBound + scrollThreshold) {
    autoScroll.value = ScrollDirection.Up;
  } else if (positionY >= upperBound - scrollThreshold) {
    autoScroll.value = ScrollDirection.Down;
  } else {
    autoScroll.value = ScrollDirection.None;
  }
}
