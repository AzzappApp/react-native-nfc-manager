import { useState } from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Helper to management plurals translations
 * @param count a string shared value
 * @returns an number representing: 0 if count = "0", 1 if count = "1", 2 otherwise
 */
export const useAnimatedTextToPluralValue = (count: SharedValue<string>) => {
  const [isPlural, setIsPlural] = useState(1);

  const inferPlural = (count: SharedValue<string>) => {
    'worklet';
    const val = parseInt(count.value, 10);
    if (val > 2) {
      return 2;
    }
    return val;
  };
  useAnimatedReaction(
    () => inferPlural(count),
    _isPlural => {
      runOnJS(setIsPlural)(_isPlural);
    },
    [],
  );
  return isPlural;
};
