import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ForwardedRef,
} from 'react';
import { Pressable, type PressableProps } from 'react-native-gesture-handler';
import { colors } from '#theme';
import type {
  LayoutChangeEvent,
  PressableAndroidRippleConfig,
  View,
} from 'react-native';
import type { PressableEvent } from 'react-native-gesture-handler/lib/typescript/components/Pressable/PressableProps';

const TIMEOUT = 200;

type PressableNativeProps = PressableProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  ripple?: PressableAndroidRippleConfig;
  onDoublePress?: () => void;
};

const PressableNative = (
  { ripple, onDoublePress, ...props }: PressableNativeProps,
  ref: ForwardedRef<View>,
) => {
  const timer = useRef<NodeJS.Timeout | null>(null);
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

  const onPress = (e: PressableEvent) => {
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
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  });

  return <Pressable onPress={onPress} {...pressableProps} />;
};

export default forwardRef(PressableNative);
