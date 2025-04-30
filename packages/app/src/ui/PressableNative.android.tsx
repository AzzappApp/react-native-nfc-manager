import { forwardRef, useState } from 'react';
import { Pressable } from 'react-native';
import { colors } from '#theme';
import type { ForwardedRef } from 'react';
import type {
  PressableProps,
  PressableAndroidRippleConfig,
  LayoutChangeEvent,
  View,
} from 'react-native';

type PressableNativeProps = PressableProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  easing?: unknown;
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
  let androidRipple = ripple ?? { borderless: false, color: colors.grey400 };
  if (!androidRipple.radius && androidRipple.borderless) {
    androidRipple = {
      ...androidRipple,
      radius: width / 2,
    };
  }
  return (
    <Pressable
      ref={ref}
      android_ripple={androidRipple}
      onLayout={onLayout}
      {...props}
    />
  );
};

export default forwardRef(PressableNative);
