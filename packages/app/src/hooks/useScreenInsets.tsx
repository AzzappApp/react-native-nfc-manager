import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Returns the screen insets.
 * On devices that doesn't have bottom safe area, it will return 16 as bottom inset.
 */
const useScreenInsets = () => {
  const insets = useSafeAreaInsets();
  return {
    top: Platform.select({
      default: Math.max(insets.top, 24),
      android: 12 + Math.max(insets.top, 24),
    }),
    bottom: Platform.select({
      default: Math.max(insets.bottom, 16),
      android: 16 + Math.max(insets.bottom, 0),
    }),
  };
};

export default useScreenInsets;
