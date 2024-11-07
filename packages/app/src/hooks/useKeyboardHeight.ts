import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import {
  interpolate,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * A hook that returns the height of the keyboard animated with reanimated.
 * The keyboard height will never shrink while it's open to prevent layout jumps.
 *
 * @returns
 */
const useKeyboardHeight = () => {
  const { progress: keyboardProgress, height: keyboardHeight } =
    useReanimatedKeyboardAnimation();

  const maxKeyboardHeight = useSharedValue(0);

  return useDerivedValue(() => {
    maxKeyboardHeight.value = Math.max(
      maxKeyboardHeight.value,
      -keyboardHeight.value,
    );
    if (keyboardProgress.value === 0) {
      maxKeyboardHeight.value = 0;
    }

    return interpolate(
      keyboardProgress.value,
      [0, 1],
      [0, maxKeyboardHeight.value],
    );
  });
};

export default useKeyboardHeight;
