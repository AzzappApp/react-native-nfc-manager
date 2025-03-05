import { useRef } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * Create a shared value from another shared Value
 * source: https://github.com/software-mansion/react-native-reanimated/discussions/6798
 *
 * @param parentSharedValue base shared value
 * @returns a new shared value with its content initialized from parentSharedValue.value
 */
const useCopyOfSharedValue = <T>(
  parentSharedValue: SharedValue<T>,
): SharedValue<T> => {
  const initialValueRef = useRef<T | undefined>(undefined);
  const isFirstRenderRef = useRef(true);

  if (isFirstRenderRef.current) {
    initialValueRef.current = parentSharedValue.value;
    isFirstRenderRef.current = false;
  }

  return useSharedValue(initialValueRef.current as T);
};

export default useCopyOfSharedValue;
