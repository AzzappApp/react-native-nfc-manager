import { forwardRef } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import type { ForwardedRef } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';
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
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PressableAnimated = (
  { disabled, ...props }: PressableAnimatedProps,
  ref: ForwardedRef<View>,
) => {
  return (
    // @ts-expect-error - AnimateProps is hard to type
    <AnimatedPressable
      ref={ref}
      accessibilityState={{ disabled: disabled ?? false }}
      disabled={disabled}
      {...props}
    />
  );
};

export default forwardRef(PressableAnimated);
