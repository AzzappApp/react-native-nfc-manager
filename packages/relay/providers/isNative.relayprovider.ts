import getRuntimeEnvironment from '@azzapp/shared/lib/getRuntimeEnvironment';

export const get = () => {
  return getRuntimeEnvironment() === 'react-native';
};
