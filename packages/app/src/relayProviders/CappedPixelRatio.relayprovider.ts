import { PixelRatio, Platform } from 'react-native';
import { MEMORY_SIZE } from '#helpers/device';

export const get = () => {
  // most of the time using 3x pixel won't make a difference in quality
  // but will make data 38% size bigger
  // see https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/capping-image-fidelity-on-ultra-high-resolution-devices
  return Platform.OS === 'android' &&
    process.env.JEST_WORKER_ID === undefined &&
    MEMORY_SIZE < 5.5
    ? 1
    : Math.min(PixelRatio.get(), 2);
};
