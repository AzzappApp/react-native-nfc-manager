import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

//there is a small bug where the keyboard height switch from one value to another and come back.
// causing blink (in addition of keyboardAvoidFrame doing flickering) seems be be linked to the securedText
// if next keybaord height is smaller than previous one, we ignore it unless it is 0 (closing)
function useAnimatedKeyboardHeight() {
  const { height, progress } = useReanimatedKeyboardAnimation();
  const keyboardHeight = useSharedValue(height.value);
  useAnimatedReaction(
    () => {
      return height.value;
    },
    (currentValue, previousValue) => {
      if (
        previousValue &&
        Math.abs(currentValue) < Math.abs(previousValue) &&
        currentValue !== 0
      ) {
        return;
      }
      if (keyboardHeight.value !== currentValue) {
        keyboardHeight.value = currentValue * progress.value;
      }
    },
  );

  return keyboardHeight;
}

export default useAnimatedKeyboardHeight;
