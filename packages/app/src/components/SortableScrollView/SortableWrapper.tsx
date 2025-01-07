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
   * the total Dimension of the container (height or width)
   *
   * @type {number}
   */
  containerDimension: number;
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
   * the height(vertical)/width(horizontal)) of the item (important to calculate the position)
   *
   * @type {number}
   */
  itemDimension: number;
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
  /**
   * Need a long press to activate drag & drop
   */
  horizontal?: boolean;
  /**
   * Need a long press to activate drag & drop
   */
  activateAfterLongPress?: boolean;
  /**
   * Initial position of the item, used only at mount
   */
  initialPosition: number;
};

const scrollDuration = 3000;

/**
 *  SortableWrapper for sortable list. Multiple part were inspired from diff gist
 *  Could have maybe written using a HOC
 */
const SortableWrapper = ({
  id,
  children,
  positions,
  containerDimension,
  lowerBound,
  autoScrollDirection,
  itemCount,
  itemDimension,
  onDragEnd,
  horizontal,
  activateAfterLongPress,
  initialPosition,
}: SortableWrapperProps) => {
  const styles = useStyleSheet(styleSheet);
  const [moving, setMoving] = useState(false);
  const position = useSharedValue(initialPosition);
  const top = useSharedValue(initialPosition);

  // empiric value, may need to be generic in the futur
  const scrollThreshold = itemDimension / 3;

  const upperBound = useDerivedValue(
    () =>
      lowerBound.get() + containerDimension - itemDimension - scrollThreshold,
  );

  const targetLowerBound = useSharedValue(lowerBound.get());

  const diffScrolling = useSharedValue(0);

  // move the position of the row
  useAnimatedReaction(
    () => position.value,
    (positionValue, previousValue) => {
      if (
        positionValue !== null &&
        previousValue !== null &&
        positionValue !== previousValue
      ) {
        if (moving) {
          top.value = positionValue;
          setPosition(positionValue, itemCount, positions, id, itemDimension);
          setAutoScroll(
            positionValue,
            lowerBound.value,
            upperBound.value,
            scrollThreshold,
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
          top.value = withSpring(currentPosition * itemDimension);
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
          case ScrollDirection.Backward: {
            targetLowerBound.value = lowerBound.value;
            targetLowerBound.value = withTiming(0, {
              duration: scrollDuration,
            });
            break;
          }
          case ScrollDirection.Forward: {
            const contentHeight = itemCount * itemDimension;
            const maxScroll =
              contentHeight - containerDimension + itemDimension;

            targetLowerBound.value = lowerBound.value;
            targetLowerBound.value = withTiming(maxScroll, {
              duration: scrollDuration,
            });
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
  const start = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .runOnJS(false)
    .onBegin(() => {
      position.value = positions.value[id] * itemDimension;
      start.value = positions.value[id] * itemDimension;
      runOnJS(setMoving)(true);
      runOnJS(trigger)('impactLight');
    })
    .onUpdate(event => {
      position.value =
        start.value +
        (horizontal ? event.translationX : event.translationY) -
        diffScrolling.value;
    })
    .onEnd(() => {
      const finishPosition = positions.value[id] * itemDimension;
      top.value = withTiming(finishPosition);
      diffScrolling.value = 0;
    })
    .activateAfterLongPress(activateAfterLongPress ? 300 : 0)
    .onFinalize(() => {
      runOnJS(setMoving)(false);
      // if the item has not moved, do not trigger onDragEnd
      if (position.value !== start.value) {
        runOnJS(onDragEnd)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      top: horizontal ? undefined : top.value,
      left: horizontal ? top.value : undefined,
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
  position: number,
  count: number,
  positions: SharedValue<{ [id: string]: number }>,
  id: string,
  itemDimension: number,
) {
  'worklet';
  const newPosition = Math.max(
    0,
    Math.min(Math.round(position / itemDimension), count - 1),
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
  position: number,
  lowerBound: number,
  upperBound: number,
  scrollThreshold: number,
  autoScroll: SharedValue<ScrollDirection>,
) {
  'worklet';
  if (position <= lowerBound + scrollThreshold) {
    autoScroll.value = ScrollDirection.Backward;
  } else if (position >= upperBound - scrollThreshold) {
    autoScroll.value = ScrollDirection.Forward;
  } else {
    autoScroll.value = ScrollDirection.None;
  }
}
