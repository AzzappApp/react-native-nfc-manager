import type { GestureResponderEvent } from 'react-native';

type Actions = {
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
};

type Position = {
  x: number;
  y: number;
};

export function useSwipe(actions: Actions, range = 20) {
  let firstTouch: Position = { x: 0, y: 0 };

  function onTouchStart(e: GestureResponderEvent) {
    firstTouch = {
      x: e.nativeEvent.pageX,
      y: e.nativeEvent.pageY,
    };
  }

  function onTouchEnd(e: GestureResponderEvent) {
    const positionX = e.nativeEvent.pageX;
    const positionY = e.nativeEvent.pageY;

    if (Math.abs(positionY - firstTouch.y) > range) return;

    // check if position is growing positively and has reached specified range
    if (positionX - firstTouch.x > range) {
      actions.onSwipeRight();
    }
    // check if position is growing negatively and has reached specified range
    else if (firstTouch.x - positionX > range) {
      actions.onSwipeLeft();
    }
  }

  return { onTouchStart, onTouchEnd };
}
