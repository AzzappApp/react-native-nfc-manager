import { forwardRef, useCallback, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import PressableAnimated from './PressableAnimated';

import type { PressableAnimatedProps } from './PressableAnimated';
import type { ForwardedRef } from 'react';
import type {
  View,
  EasingFunction,
  PressableStateCallbackType,
  ViewStyle,
  StyleProp,
} from 'react-native';
import type { EasingFunctionFactory } from 'react-native-reanimated';

type PressableScaleHighlight = Omit<PressableAnimatedProps, 'style'> & {
  highlightColor?: string;
  activeScale?: number;
  scale?: number;
  opacity?: number;
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  easing?: EasingFunction | EasingFunctionFactory;
  style: StyleProp<ViewStyle>;
};

const PressableScaleHighlight = (
  {
    highlightColor = colors.grey900,
    scale = 1,
    activeScale = 0.97,
    opacity = 1,
    activeOpacity = 0.5,
    disabledOpacity = 0.5,
    animationDuration = 150,
    easing = Easing.inOut(Easing.ease),
    disabled,
    children,
    style,
    ...props
  }: PressableScaleHighlight,
  ref: ForwardedRef<View>,
) => {
  const bgColor = useMemo(() => {
    const forcedStyle = StyleSheet.flatten(style) as Omit<ViewStyle, 'false'>; //don't manage other way
    if (forcedStyle?.backgroundColor) {
      return forcedStyle?.backgroundColor;
    }
    return 'rgba(255,255,255,0)';
  }, [style]);

  const pressed = useSharedValue(0);

  const onPressIn = useCallback(() => {
    pressed.value = withTiming(1, { duration: animationDuration, easing });
  }, [animationDuration, easing, pressed]);

  const onPressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: animationDuration, easing });
  }, [animationDuration, easing, pressed]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor:
        Platform.OS === 'ios'
          ? interpolateColor(
              pressed.value,
              [0, 1],
              [bgColor as string, highlightColor],
            )
          : bgColor,
      opacity: disabled
        ? disabledOpacity
        : interpolate(pressed.value, [0, 1], [opacity, activeOpacity]),
      transform: [
        { scale: interpolate(pressed.value, [0, 1], [scale, activeScale]) },
      ],
    };
  });

  return (
    <PressableAnimated
      ref={ref}
      disabled={disabled}
      {...props}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[style, animatedStyle]}
      android_ripple={{
        foreground: true,
        borderless: false,
        color: highlightColor,
      }}
    >
      {(state: PressableStateCallbackType) => {
        return typeof children === 'function' ? children(state) : children;
      }}
    </PressableAnimated>
  );
};

export default forwardRef(PressableScaleHighlight);
