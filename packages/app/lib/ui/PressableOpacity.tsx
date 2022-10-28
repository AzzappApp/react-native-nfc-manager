import { forwardRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { getPressableStyle } from '../helpers/gestureHelpers';
import PressableTransition from './PressableTransition';
import type { Easing } from './ViewTransition';
import type { ForwardedRef } from 'react';
import type {
  PressableProps,
  View,
  PressableStateCallbackType,
} from 'react-native';

type PressableOpacityProps = PressableProps & {
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  easing?: Easing;
};

const PressableOpacity = (
  {
    activeOpacity = 0.2,
    animationDuration = 150,
    disabledOpacity = 0.3,
    easing = 'ease-in-out',
    disabled,
    style,
    ...props
  }: PressableOpacityProps,
  ref: ForwardedRef<View>,
) => {
  const styleFunc = useCallback(
    (state: PressableStateCallbackType) => {
      const styleObj = getPressableStyle(style, { pressed: false });
      const defaultOpacity = StyleSheet.flatten(styleObj)?.opacity ?? 1;

      return [
        getPressableStyle(style, state),
        {
          opacity: disabled
            ? disabledOpacity
            : state.pressed
            ? activeOpacity
            : defaultOpacity,
        },
      ];
    },
    [activeOpacity, disabled, disabledOpacity, style],
  );

  return (
    <PressableTransition
      ref={ref}
      style={styleFunc}
      disabled={disabled}
      accessibilityState={{ disabled: disabled ?? false }}
      transitions={opacityTransitions}
      transitionDuration={animationDuration}
      easing={easing}
      {...props}
    />
  );
};

export default forwardRef(PressableOpacity);

const opacityTransitions = ['opacity'] as const;
