import createRelayEnvironment from '@azzapp/shared/lib/createRelayEnvironment';
import fetchWithRefreshToken from './fetchWithRefreshToken';
import type { Environment } from 'relay-runtime';

let environment: Environment | null;

const listeners: Array<() => void> = [];
export const getRelayEnvironment = () => {
  if (!environment) {
    environment = createRelayEnvironment({
      fetchFunction: fetchWithRefreshToken,
    });
  }
  return environment;
};

export const resetEnvironment = () => {
  environment?.commitUpdate(store => {
    (store as any).invalidateStore();
  });
  listeners.forEach(listener => listener());
};

export const addEnvironmentListener = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};
