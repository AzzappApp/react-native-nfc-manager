import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import type { ViewProps, EasingFunction } from 'react-native';
type AnimatedCircleHintProps = ViewProps & {
  animating: boolean;
  duration?: number;
  easing?: EasingFunction;
  hidesWhenStopped?: boolean;
};
const AnimatedCircleHint = ({
  children,
  style,
  animating = false,
  duration = 1000,
  easing = Easing.linear,
  hidesWhenStopped = true,
  ...props
}: AnimatedCircleHintProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animation = Animated.loop(
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration,
        useNativeDriver: true,
        easing,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        easing,
      }),
    ]),
  );

  useEffect(() => {
    if (animating) {
      animation.start();
    } else {
      animation.stop();
    }
    return () => animation.stop();
  }, [animation, animating]);

  if (!animating && hidesWhenStopped) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      {...props}
      style={[
        {
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: 'rgba(0,0,0,0.54)',
        },
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedCircleHint;
