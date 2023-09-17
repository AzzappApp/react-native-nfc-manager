import type { PressableProps, PressableStateCallbackType } from 'react-native';

/**
 * Resolve pressable style based on pressable state
 * @param style the style prop of the pressable
 * @param state the pressable state
 * @returns the resolved style
 */
export const getPressableStyle = (
  style: PressableProps['style'],
  state: PressableStateCallbackType,
) => (typeof style === 'function' ? style(state) : style);
