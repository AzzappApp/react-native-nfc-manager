import type { PressableProps, PressableStateCallbackType } from 'react-native';

export const getPressableStyle = (
  style: PressableProps['style'],
  state: PressableStateCallbackType,
) => (typeof style === 'function' ? style(state) : style);
