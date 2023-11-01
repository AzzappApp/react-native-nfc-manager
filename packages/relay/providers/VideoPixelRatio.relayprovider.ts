import { PixelRatio, Platform } from 'react-native';

export const get = () => {
  return Platform.OS === 'android' ? PixelRatio.get() / 2 : PixelRatio.get();
};
