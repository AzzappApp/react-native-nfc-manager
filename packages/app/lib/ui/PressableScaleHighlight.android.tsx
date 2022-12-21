import { forwardRef } from 'react';
import { getPressableStyle } from '../helpers/gestureHelpers';
import PressableTransition from './PressableTransition';
import type { Easing } from './ViewTransition';
import type { ForwardedRef } from 'react';
import type { ColorValue, PressableProps, View } from 'react-native';

type PressableScaleHighlight = PressableProps & {
  highlightColor?: ColorValue;
  activeScale?: number;
  scale?: number;
  opacity?: number;
  activeOpacity?: number;
  disabledOpacity?: number;
  animationDuration?: number;
  easing?: Easing;
};

const PressableScaleHighlight = (
  {
    scale = 1,
    activeScale = 0.97,
    opacity = 1,
    disabledOpacity = 0.5,
    animationDuration = 150,
    easing = 'ease-in-out',
    highlightColor,
    disabled,
    style,
    ...props
  }: PressableScaleHighlight,
  ref: ForwardedRef<View>,
) => (
  <PressableTransition
    style={state => [
      getPressableStyle(style, state),
      {
        transform: [{ scale: state.pressed ? activeScale : scale }],
        opacity: disabled ? disabledOpacity : opacity,
      },
    ]}
    ref={ref}
    disabled={disabled}
    transitionDuration={animationDuration}
    transitions={['transform']}
    easing={easing}
    android_ripple={{
      foreground: true,
      borderless: false,
      color: highlightColor,
    }}
    {...props}
  />
);

export default forwardRef(PressableScaleHighlight);
