import { PixelRatio } from 'react-native';
import getRuntimeEnvironment from '@azzapp/shared/getRuntimeEnvironment';

export const get = () => {
  if (getRuntimeEnvironment() !== 'react-native') {
    return 2;
  }
  // most of the time using 3x pixel won't make a difference in quality
  // but will make data 38% size bigger
  // see https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/capping-image-fidelity-on-ultra-high-resolution-devices
  return Math.min(PixelRatio.get(), 2);
};
