import { forwardRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { getPressableStyle } from '../helpers/gestureHelpers';
import PressableTransition from './PressableTransition';
import type { Easing } from './ViewTransition';
import type { ForwardedRef } from 'react';
import type {
  PressableProps,
  View,
  PressableStateCallbackType,
  ColorValue,
} from 'react-native';

type PressableBackgroundProps = PressableProps & {
  highlightColor?: ColorValue;
  animationDuration?: number;
  easing?: Easing;
};

const PressableBackground = (
  {
    highlightColor = colors.grey100,
    animationDuration = 150,
    easing = 'ease-in-out',
    disabled,
    style,
    ...props
  }: PressableBackgroundProps,
  ref: ForwardedRef<View>,
) => {
  const styleFunc = useCallback(
    (state: PressableStateCallbackType) => {
      const styleObj = getPressableStyle(style, { pressed: false });
      const defaultBackground = StyleSheet.flatten(styleObj)?.backgroundColor;

      if (!defaultBackground) {
        console.warn(
          'PressableBackground animation might have undesired behavior if no background color is provided',
        );
      }

      return [
        getPressableStyle(style, state),
        {
          backgroundColor: state.pressed
            ? highlightColor
            : defaultBackground ?? 'rgba(0,0,0,0)',
        },
      ];
    },
    [highlightColor, style],
  );

  return (
    <PressableTransition
      ref={ref}
      style={styleFunc}
      disabled={disabled}
      transitions={backgroundTransitions}
      transitionDuration={animationDuration}
      easing={easing}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled ?? false }}
      {...props}
    />
  );
};

export default forwardRef(PressableBackground);

const backgroundTransitions = ['backgroundColor'] as const;
