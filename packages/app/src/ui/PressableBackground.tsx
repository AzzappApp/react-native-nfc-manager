import { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  type EasingFunctionFactory,
  interpolateColor,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';

import PressableAnimated from './PressableAnimated';
import type { PressableAnimatedProps } from './PressableAnimated';
import type { ForwardedRef } from 'react';
import type { View, EasingFunction, StyleProp, ViewStyle } from 'react-native';

type PressableOpacityProps = Omit<PressableAnimatedProps, 'style'> & {
  highlightColor?: string;
  backgroundColor?: string;
  disabledOpacity?: number;
  animationDuration?: number;
  easing?: EasingFunction | EasingFunctionFactory;
  style: StyleProp<ViewStyle>;
};

const PressableBackground = (
  {
    highlightColor,
    backgroundColor,
    animationDuration = 150,
    disabledOpacity = 0.3,
    easing = Easing.inOut(Easing.ease),
    style,
    disabled,
    id,
    ...props
  }: PressableOpacityProps,
  ref: ForwardedRef<View>,
) => {
  const colorScheme = useColorScheme();

  const highColor = useMemo(() => {
    if (highlightColor) {
      return highlightColor;
    }
    if (colorScheme === 'dark') {
      return 'rgba(255,255,255,0.2)';
    } else {
      return 'rgba(0,0,0,0.2)';
    }
  }, [colorScheme, highlightColor]);

  const bgColor = useMemo(() => {
    if (backgroundColor) {
      return backgroundColor;
    } else if (StyleSheet.flatten(style)?.backgroundColor) {
      return StyleSheet.flatten(style)?.backgroundColor as string;
    }
    if (colorScheme === 'dark') {
      return colors.white;
    } else {
      return colors.black;
    }
  }, [backgroundColor, colorScheme, style]);

  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        pressed.value,
        [0, 1],
        [bgColor, highColor],
      ),
    };
  });

  const onPressIn = useCallback(() => {
    pressed.set(
      withTiming(1, {
        duration: animationDuration,
        easing,
      }),
    );
  }, [animationDuration, pressed, easing]);

  const onPressOut = useCallback(() => {
    pressed.set(
      withTiming(0, {
        duration: animationDuration,
        easing,
      }),
    );
  }, [animationDuration, pressed, easing]);

  return (
    <PressableAnimated
      ref={ref}
      {...props}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[
        style,
        { opacity: disabled ? disabledOpacity : 1 },
        animatedStyle,
      ]}
    />
  );
};

export default forwardRef(PressableBackground);
