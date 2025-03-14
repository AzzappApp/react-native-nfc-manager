import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ForwardedRef,
} from 'react';
import {
  type LayoutChangeEvent,
  type PressableAndroidRippleConfig,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { colors } from '#theme';
import type GenericTouchable from 'react-native-gesture-handler/lib/typescript/components/touchables/GenericTouchable';
import type { GenericTouchableProps } from 'react-native-gesture-handler/lib/typescript/components/touchables/GenericTouchableProps';

const TIMEOUT = 200;

type PressableNativeProps = GenericTouchableProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  ripple?: PressableAndroidRippleConfig;
  onDoublePress?: () => void;
};

const PressableNative = (
  { ripple, onDoublePress, ...props }: PressableNativeProps,
  ref: ForwardedRef<GenericTouchable>,
) => {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const [width, setWidth] = useState(0);
  const androidRipple = ripple ?? { borderless: false, color: colors.grey400 };
  const shallHandleWidth = !androidRipple.radius && androidRipple.borderless;

  const onLayout = shallHandleWidth
    ? (e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width);
      }
    : undefined;

  if (shallHandleWidth) {
    androidRipple.radius = width / 2 + 2;
  }

  if (androidRipple.radius) {
    androidRipple.radius = Math.round(androidRipple.radius);
  }

  const pressableProps = {
    ref,
    android_ripple: androidRipple,
    onLayout,
    ...props,
  } as const;

  const onPress = () => {
    if (timer.current && onDoublePress) {
      clearTimeout(timer.current);
      timer.current = null;
      onDoublePress();
    } else if (onDoublePress) {
      timer.current = setTimeout(() => {
        timer.current = null;
        props.onPress?.();
      }, TIMEOUT);
    } else {
      props.onPress?.();
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
