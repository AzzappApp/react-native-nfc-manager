import type { ViewProps, ViewStyle } from 'react-native';

export type TransitionableStyle = Exclude<
  keyof ViewStyle,
  | 'alignContent'
  | 'alignItems'
  | 'alignSelf'
  | 'backfaceVisibility'
  | 'borderStyle'
  | 'direction'
  | 'display'
  | 'flexDirection'
  | 'flexWrap'
  | 'justifyContent'
  | 'overflow'
  | 'position'
  | 'testID'
>;

export type TransitionValues = { [K in TransitionableStyle]?: ViewStyle[K] };

export type Easing = 'ease-in-out' | 'ease-in' | 'ease-out' | 'ease' | 'linear';

export type ViewTransitionProps = ViewProps & {
  transitions: readonly TransitionableStyle[];
  transitionDuration: number;
  disableAnimation?: boolean;
  easing?: Easing;
};
