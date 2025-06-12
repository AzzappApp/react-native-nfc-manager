import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';
import type { ScaledSize } from 'react-native';

export default function useScreenDimensions(): ScaledSize {
  return useSyncExternalStore(
    // Subscribe to screen dimension changes
    callback => {
      const subscription = Dimensions.addEventListener('change', callback);
      return subscription.remove;
    },
    // Get current dimensions
    () => Dimensions.get('screen'),
  );
}
