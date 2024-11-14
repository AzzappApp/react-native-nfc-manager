import { forwardRef, useState, type ForwardedRef } from 'react';
import { Pressable, type PressableProps } from 'react-native-gesture-handler';
import { colors } from '#theme';
import type {
  LayoutChangeEvent,
  PressableAndroidRippleConfig,
  View,
} from 'react-native';

type PressableNativeProps = PressableProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  ripple?: PressableAndroidRippleConfig;
};

const PressableNative = (
  { ripple, ...props }: PressableNativeProps,
  ref: ForwardedRef<View>,
) => {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };
  const androidRiple = ripple ?? { borderless: false, color: colors.grey400 };
  if (!androidRiple.radius && androidRiple.borderless) {
    androidRiple.radius = width / 2 + 2;
  }

  if (androidRiple.radius) {
    androidRiple.radius = Math.round(androidRiple.radius);
  }

  const pressableProps = {
    ref,
    android_ripple: androidRiple,
    onLayout,
    ...props,
  } as const;

  return <Pressable {...pressableProps} />;
};

export default forwardRef(PressableNative);
