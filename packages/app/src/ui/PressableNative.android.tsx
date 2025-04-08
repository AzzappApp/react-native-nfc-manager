import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ForwardedRef,
} from 'react';
import {
  type LayoutChangeEvent,
  type PressableAndroidRippleConfig,
  type View,
} from 'react-native';
import { Pressable as RNPressable } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { colors } from '#theme';
import type { GenericTouchableProps } from 'react-native-gesture-handler/lib/typescript/components/touchables/GenericTouchableProps';

const TIMEOUT = 200;

type PressableNativeProps = GenericTouchableProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  ripple?: PressableAndroidRippleConfig;
  onDoublePress?: () => void;
  useRNPressable?: boolean; // Use RN Pressable instead of GestureHandler (only for Android - to be removed once RN Pressable)
};

const PressableNative = (
  {
    ripple,
    onDoublePress,
    onPress: onPressProp,
    useRNPressable,
    ...props
  }: PressableNativeProps,
  ref: ForwardedRef<View>,
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

  const onPress = useCallback(() => {
    if (timer.current && onDoublePress) {
      clearTimeout(timer.current);
      timer.current = null;
      onDoublePress();
    } else if (onDoublePress) {
      timer.current = setTimeout(() => {
        timer.current = null;
        onPressProp?.();
      }, TIMEOUT);
    } else {
      onPressProp?.();
    }
  }, [onDoublePress, onPressProp]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const Component = useRNPressable ? RNPressable : Pressable;

  return (
    <Component
      ref={ref}
      android_ripple={androidRipple}
      onLayout={onLayout}
      onPress={onPress}
      {...props}
    />
  );
};

export default forwardRef(PressableNative);
