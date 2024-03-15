import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { Swipeable } from 'react-native-gesture-handler';
import type { ReactNode } from 'react';
import type { Animated } from 'react-native';

type SwipeableRowProps = {
  children: ReactNode;
  RightActions: React.FC<SwipeableRowActionsProps>;
};

export type SwipeableRowActionsProps = {
  progress: Animated.AnimatedInterpolation<number | string>;
  onClose: () => void;
};

export type SwipeableRowHandle = {
  close: () => void;
};

const SwipeableRow = forwardRef<SwipeableRowHandle, SwipeableRowProps>(
  function SwipeableRowInner(props, ref) {
    const { children, RightActions } = props;
    const swipeable = useRef<Swipeable>(null);

    const close = useCallback(() => {
      swipeable.current?.close();
    }, []);

    useImperativeHandle(ref, () => ({
      close,
    }));

    return (
      <Swipeable
        ref={swipeable}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={progress => (
          <RightActions progress={progress} onClose={close} />
        )}
      >
        {children}
      </Swipeable>
    );
  },
);

export default SwipeableRow;
