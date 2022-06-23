import { cloneElement, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import type { ReactElement } from 'react';

const Fade = ({
  hidden,
  children,
  duration = 300,
}: {
  hidden?: boolean;
  children: ReactElement;
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

  return cloneElement(children, { style: [children.props.style, { opacity }] });
};

export default Fade;
