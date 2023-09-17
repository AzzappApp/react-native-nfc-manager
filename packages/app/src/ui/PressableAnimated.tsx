import { forwardRef } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import type { ForwardedRef } from 'react';
import type { PressableProps, View, ViewStyle } from 'react-native';
import type {
  AnimateProps,
  BaseAnimationBuilder,
  EntryExitAnimationFunction,
  LayoutAnimationFunction,
} from 'react-native-reanimated';

export type PressableAnimatedProps = Exclude<PressableProps, 'style'> & {
  style?: Animated.AnimateStyle<ViewStyle>;
  animatedProps?: Partial<AnimateProps<PressableProps>>;
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
