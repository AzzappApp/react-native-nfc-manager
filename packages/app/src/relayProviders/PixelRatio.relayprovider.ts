import { PixelRatio, Platform } from 'react-native';

export const get = () => {
  return Platform.OS === 'android' && process.env.JEST_WORKER_ID === undefined
    ? 1
    : PixelRatio.get();
};
