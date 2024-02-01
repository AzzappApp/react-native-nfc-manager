import { memoize } from 'lodash';
import { useMemo, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  KeyboardEvents,
  useKeyboardHandler,
} from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';
import type { RefObject } from 'react';

const useFormKeyboardManager = () => {
  const ignoreNextKeyboardEvent = useRef(false);
  const focusNextInput = useMemo(
    () =>
      memoize((nextInput?: RefObject<{ focus(): void }>) => () => {
        // On Android, changing focus in the onSubmitEditing handler
        // will trigger the keyboard to hide and show again.
        if (nextInput?.current && Platform.OS === 'android') {
          ignoreNextKeyboardEvent.current = true;
          setTimeout(() => {
            ignoreNextKeyboardEvent.current = false;
          }, 300);
          nextInput.current.focus();
        }
      }),
    [],
  );

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
        if (ignoreNextKeyboardEvent.current) {
          return;
        }
        keyboardState.value = 'showing';
      }),
      KeyboardEvents.addListener('keyboardDidShow', () => {
        if (ignoreNextKeyboardEvent.current) {
          return;
        }
        keyboardState.value = 'visible';
      }),
      KeyboardEvents.addListener('keyboardWillHide', () => {
        if (ignoreNextKeyboardEvent.current) {
          return;
        }
        keyboardState.value = 'hiding';
      }),
      KeyboardEvents.addListener('keyboardDidHide', () => {
        if (ignoreNextKeyboardEvent.current) {
          return;
        }
        keyboardState.value = 'hidden';
      }),
    ];

    return () => {
      listeners.forEach(listener => listener.remove());
    };
  }, [keyboardState]);

  return { translateY, focusNextInput };
};

export default useFormKeyboardManager;
