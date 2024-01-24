import { Platform } from 'react-native';

export const get = () => {
  return process.env.JEST_WORKER_ID !== undefined || Platform.OS === 'android';
};
