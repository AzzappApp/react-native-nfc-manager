import { Dimensions } from 'react-native';
import getRuntimeEnvironment from '@azzapp/shared/lib/getRuntimeEnvironment';

export const get = () => {
  if (getRuntimeEnvironment() !== 'react-native') {
    return -1;
  }
  return Dimensions.get('screen').width;
};
