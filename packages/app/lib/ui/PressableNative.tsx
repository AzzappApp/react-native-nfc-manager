import { forwardRef } from 'react';
import { Platform, Pressable } from 'react-native';
import { colors } from '../../theme';
import PressableOpacity from './PressableOpacity';
import type { Easing } from './ViewTransition';
import type { ForwardedRef } from 'react';
import type {
  PressableProps,
  PressableAndroidRippleConfig,
  View,
} from 'react-native';

type PressableNativeProps = PressableProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  easing?: Easing;
  ripple?: PressableAndroidRippleConfig;
};

const PressableNative = (
  {
    // TODO configure rippleConfig
    ripple = { borderless: false, color: colors.grey500 },
    ...props
  }: PressableNativeProps,
  ref: ForwardedRef<View>,
) => {
  return Platform.select({
    default: <PressableOpacity ref={ref} {...props} />,
    android: <Pressable ref={ref} android_ripple={ripple} {...props} />,
  });
};

export default forwardRef(PressableNative);
