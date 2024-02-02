import { useEffect } from 'react';
import {
  KeyboardEvents,
  useKeyboardHandler,
} from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

//there is a small bug where the keyboard height switch from one value to another and come back.
// causing blink (in addition of keyboardAvoidFrame doing flickering) seems be be linked to the securedText
// if next keyboard height is smaller than previous one, we ignore it unless it is 0 (closing)
function useAnimatedKeyboardHeight() {
  const translateY = useSharedValue(0);
  const keyboardState = useSharedValue<
    'hidden' | 'hiding' | 'showing' | 'visible'
  >('hidden');

  useKeyboardHandler(
    {
      onMove: e => {
        'worklet';
        if (
          keyboardState.value === 'hiding' ||
          keyboardState.value === 'showing'
        ) {
          translateY.value = e.height;
        }
      },
    },
    [],
  );

  useEffect(() => {
    const listeners = [
      KeyboardEvents.addListener('keyboardWillShow', () => {
        keyboardState.value = 'showing';
      }),
      KeyboardEvents.addListener('keyboardDidShow', () => {
        keyboardState.value = 'visible';
      }),
      KeyboardEvents.addListener('keyboardWillHide', () => {
        keyboardState.value = 'hiding';
      }),
      KeyboardEvents.addListener('keyboardDidHide', () => {
        keyboardState.value = 'hidden';
      }),
    ];

    return () => {
      listeners.forEach(listener => listener.remove());
    };
  }, [keyboardState]);

  return translateY;
}

export default useAnimatedKeyboardHeight;
