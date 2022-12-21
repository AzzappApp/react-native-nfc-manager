import { forwardRef } from 'react';
import { Platform } from 'react-native';
import { colors } from '../../theme';
import { getPressableStyle } from '../helpers/gestureHelpers';
import PressableTransition from './PressableTransition';
import ViewTransition from './ViewTransition';
import type { Easing } from './ViewTransition';
import type { ForwardedRef } from 'react';
import type {
  ColorValue,
  PressableProps,
  View,
  PressableStateCallbackType,
} from 'react-native';

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
    highlightColor = colors.grey900,
    scale = 1,
    activeScale = 0.97,
    opacity = 1,
    activeOpacity = 0.5,
    disabledOpacity = 0.5,
    animationDuration = 150,
    easing = 'ease-in-out',
    disabled,
    children,
    style,
    ...props
  }: PressableScaleHighlight,
  ref: ForwardedRef<View>,
) => (
  <PressableTransition
    style={state => [
      getPressableStyle(style, state),
      { transform: [{ scale: state.pressed ? activeScale : scale }] },
    ]}
    ref={ref}
    disabled={disabled}
    transitionDuration={animationDuration}
    transitions={['transform']}
    easing={easing}
    {...props}
  >
    {(state: PressableStateCallbackType) => {
      return (
        <>
          <ViewTransition
            transitionDuration={animationDuration / 2}
            transitions={['backgroundColor']}
            easing={easing}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: -1,
              backgroundColor: state.pressed
                ? highlightColor
                : 'rgba(255,255,255,0)',
            }}
          />
          <ViewTransition
            transitionDuration={animationDuration}
            transitions={['opacity']}
            easing={easing}
            style={{
              flex: 1,
              opacity: disabled
                ? disabledOpacity
                : state.pressed && Platform.OS !== 'android'
                ? activeOpacity
                : opacity,
            }}
          >
            {typeof children === 'function' ? children(state) : children}
          </ViewTransition>
        </>
      );
    }}
  </PressableTransition>
);

export default forwardRef(PressableScaleHighlight);
