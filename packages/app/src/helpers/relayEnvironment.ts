import createRelayEnvironment from '@azzapp/shared/createRelayEnvironment';
import { addAuthStateListener } from './authStore';
import fetchWithAuthTokens from './fetchWithAuthTokens';
import fetchWithGlobalEvents from './fetchWithGlobalEvents';
import type { Environment } from 'relay-runtime';

let environment: Environment | null;

const listeners: Array<() => void> = [];
export const getRelayEnvironment = () => {
  if (!environment) {
    environment = createRelayEnvironment({
      fetchFunction: fetchWithGlobalEvents(fetchWithAuthTokens),
    });
    addAuthStateListener(resetEnvironment);
  }
  return environment;
};

const resetEnvironment = () => {
  environment?.commitUpdate(store => {
    store.getRoot().getLinkedRecord('viewer')?.invalidateRecord();
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
