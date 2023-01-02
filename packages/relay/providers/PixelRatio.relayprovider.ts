import getRuntimeEnvironment from '@azzapp/shared/lib/getRuntimeEnvironment';
import { PixelRatio } from 'react-native';

export const get = () => {
  if (getRuntimeEnvironment() !== 'react-native') {
    return 2;
  }
  return PixelRatio.get();
};
