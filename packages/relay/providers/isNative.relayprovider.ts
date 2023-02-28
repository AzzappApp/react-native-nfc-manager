import getRuntimeEnvironment from '@azzapp/shared/getRuntimeEnvironment';

export const get = () => {
  return getRuntimeEnvironment() === 'react-native';
};
