import createRelayEnvironment from '@azzapp/shared/createRelayEnvironment';
import fetchWithAuthTokens from './fetchWithAuthTokens';
import type { Environment } from 'relay-runtime';

let environment: Environment | null;

const listeners: Array<() => void> = [];
export const getRelayEnvironment = () => {
  if (!environment) {
    environment = createRelayEnvironment({
      fetchFunction: fetchWithAuthTokens,
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
