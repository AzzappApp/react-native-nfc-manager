import { Animated } from 'react-native';
import type { ReactNode } from 'react';

type RightActionProps = {
  x: number;
  progress: Animated.AnimatedInterpolation<number | string>;
  children: ReactNode;
};

const SwipeableRowRightAction = (props: RightActionProps) => {
  const { x, progress, children } = props;

  const trans = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [x, 0],
  });

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
      {children}
    </Animated.View>
  );
};

export default SwipeableRowRightAction;
