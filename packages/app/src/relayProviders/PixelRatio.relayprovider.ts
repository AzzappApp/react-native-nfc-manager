import { PixelRatio, Platform } from 'react-native';
import { MEMORY_SIZE } from '#helpers/device';

export const get = () => {
  return Platform.OS === 'android' &&
    process.env.JEST_WORKER_ID === undefined &&
    MEMORY_SIZE < 8
    ? 1
    : PixelRatio.get();
};
