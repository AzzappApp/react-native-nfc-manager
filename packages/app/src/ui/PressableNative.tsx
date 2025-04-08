import { forwardRef } from 'react';
import PressableOpacity from './PressableOpacity';
import type { PressableOpacityProps } from './PressableOpacity';
import type { ForwardedRef } from 'react';
import type { Easing, PressableAndroidRippleConfig, View } from 'react-native';

export type PressableNativeProps = PressableOpacityProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  easing?: Easing;
  ripple?: PressableAndroidRippleConfig;
  useRNPressable?: boolean; // Use RN Pressable instead of GestureHandler (only for Android - to be removed once RN Pressable)
};

const PressableNative = (
  { ...props }: PressableNativeProps,
  ref: ForwardedRef<View>,
) => {
  return <PressableOpacity ref={ref} {...props} />;
};

export default forwardRef(PressableNative);
