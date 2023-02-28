import { Dimensions } from 'react-native';
import getRuntimeEnvironment from '@azzapp/shared/getRuntimeEnvironment';

export const get = () => {
  if (getRuntimeEnvironment() !== 'react-native') {
    return 128;
  }
  return (Dimensions.get('screen').width - 24) / 2;
};
