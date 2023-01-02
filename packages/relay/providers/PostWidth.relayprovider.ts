import getRuntimeEnvironment from '@azzapp/shared/lib/getRuntimeEnvironment';
import { Dimensions } from 'react-native';

export const get = () => {
  if (getRuntimeEnvironment() !== 'react-native') {
    return 128;
  }
  return (Dimensions.get('screen').width - 24) / 2;
};
