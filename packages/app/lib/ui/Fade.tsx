import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import type { ViewProps } from 'react-native';

const Fade = ({
  hidden,
  style,
  duration = 300,
  ...props
}: ViewProps & {
  hidden?: boolean;
  duration?: number;
}) => {
  const opacity = useRef(new Animated.Value(hidden ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: hidden ? 0 : 1,
      duration,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [duration, hidden, opacity]);

  return <Animated.View style={[style, { opacity }]} {...props} />;
};

export default Fade;
