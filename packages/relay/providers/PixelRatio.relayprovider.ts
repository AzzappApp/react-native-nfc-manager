import { PixelRatio } from 'react-native';
import getRuntimeEnvironment from '@azzapp/shared/getRuntimeEnvironment';

export const get = () => {
  if (getRuntimeEnvironment() !== 'react-native') {
    return 2;
  }
  return PixelRatio.get();
};
