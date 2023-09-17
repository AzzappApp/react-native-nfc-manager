import { forwardRef } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type EasingFunctionFactory,
} from 'react-native-reanimated';

import PressableAnimated from './PressableAnimated';
import type { PressableAnimatedProps } from './PressableAnimated';
import type { ForwardedRef } from 'react';
import type { View, EasingFunction, ViewStyle, StyleProp } from 'react-native';

export type PressableOpacityProps = PressableAnimatedProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  easing?: EasingFunction | EasingFunctionFactory;
  style?: StyleProp<ViewStyle>;
};

const PressableOpacity = (
  {
    activeOpacity = 0.2,
    animationDuration = 150,
    disabledOpacity = 0.3,
    easing = Easing.inOut(Easing.ease),
    disabled,
    style,
    ...props
  }: PressableOpacityProps,
  ref: ForwardedRef<View>,
) => {
  const opacityValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityValue.value,
    };
  }, [opacityValue]);

  const onFadeIn = () => {
    opacityValue.value = withTiming(activeOpacity, {
      duration: animationDuration,
      easing,
    });
  };

  const onFadeOut = () => {
    opacityValue.value = withTiming(1, {
      duration: animationDuration,
      easing,
    });
  };

  return (
    <PressableAnimated
      ref={ref}
      {...props}
      onPressIn={onFadeIn}
      onPressOut={onFadeOut}
      disabled={disabled}
      style={[style, disabled ? { opacity: disabledOpacity } : animatedStyle]}
    />
  );
};

export default forwardRef(PressableOpacity);
