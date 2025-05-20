import { forwardRef, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { colors } from '#theme';
import type { ForwardedRef } from 'react';
import type {
  PressableProps,
  PressableAndroidRippleConfig,
  LayoutChangeEvent,
  View,
  GestureResponderEvent,
} from 'react-native';

const TIMEOUT = 200;

type PressableNativeProps = PressableProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  easing?: unknown;
  ripple?: PressableAndroidRippleConfig;
  onDoublePress?: () => void;
};

const PressableNative = (
  { ripple, onDoublePress, ...props }: PressableNativeProps,
  ref: ForwardedRef<View>,
) => {
  const [width, setWidth] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const onPress = (e: GestureResponderEvent) => {
    if (timer.current && onDoublePress) {
      clearTimeout(timer.current);
      timer.current = null;
      onDoublePress();
    } else if (onDoublePress) {
      timer.current = setTimeout(() => {
        timer.current = null;
        props.onPress?.(e);
      }, TIMEOUT);
    } else {
      props.onPress?.(e);
    }
  };

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
      onPress={onPress}
    />
  );
};

export default forwardRef(PressableNative);
