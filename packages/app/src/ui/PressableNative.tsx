import { forwardRef } from 'react';
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
  { ...props }: PressableNativeProps,
  ref: ForwardedRef<View>,
) => {
  return <PressableOpacity ref={ref} {...props} />;
};

export default forwardRef(PressableNative);
