import { forwardRef, useRef } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import type { ForwardedRef } from 'react';
import type {
  GestureResponderEvent,
  PressableProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import type {
  AnimatedProps,
  AnimatedStyle,
  BaseAnimationBuilder,
  EntryExitAnimationFunction,
  LayoutAnimationFunction,
} from 'react-native-reanimated';

export type PressableAnimatedProps = Exclude<PressableProps, 'style'> & {
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
  animatedProps?: Partial<AnimatedProps<PressableProps>>;
  layout?:
    | BaseAnimationBuilder
    | LayoutAnimationFunction
    | typeof BaseAnimationBuilder;
  entering?:
    | BaseAnimationBuilder
    | EntryExitAnimationFunction
    | Keyframe
    | typeof BaseAnimationBuilder;
  exiting?:
    | BaseAnimationBuilder
    | EntryExitAnimationFunction
    | Keyframe
    | typeof BaseAnimationBuilder;
  onDoublePress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TIMEOUT = 200;

const PressableAnimated = (
  { disabled, onDoublePress, ...props }: PressableAnimatedProps,
  ref: ForwardedRef<View>,
) => {
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

  return (
    // @ts-expect-error - AnimateProps is hard to type
    <AnimatedPressable
      ref={ref}
      accessibilityState={{ disabled: disabled ?? false }}
      disabled={disabled}
      {...props}
      onPress={onPress}
    />
  );
};

export default forwardRef(PressableAnimated);
