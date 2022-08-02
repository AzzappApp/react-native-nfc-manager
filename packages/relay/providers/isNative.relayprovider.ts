import { Platform } from 'react-native';

export const get = () => {
  return Platform.select({
    web: false,
    default: true,
  });
};
