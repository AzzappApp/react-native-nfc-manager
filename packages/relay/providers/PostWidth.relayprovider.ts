import { Dimensions } from 'react-native';

export const get = () => {
  return (Dimensions.get('screen').width - 24) / 2;
};
