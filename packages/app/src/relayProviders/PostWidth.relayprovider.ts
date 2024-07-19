import { Dimensions } from 'react-native';

export const get = () => {
  return (Dimensions.get('window').width - 24) / 2;
};
