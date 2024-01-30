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
      default: insets.top,
      android: Math.max(insets.top, 15),
    }),
    bottom: Math.max(insets.bottom, 16),
  };
};

export default useScreenInsets;
