import createRelayEnvironment from '@azzapp/shared/createRelayEnvironment';
import { fetchJSON } from '@azzapp/shared/networkHelpers';
import { addAuthStateListener } from './authStore';
import fetchWithAuthTokens from './fetchWithAuthTokens';
import fetchWithGlobalEvents from './fetchWithGlobalEvents';
import { clearActiveQueries } from './RelayQueryManager';
import type { AuthState } from './authStore';
import type { Environment } from 'relay-runtime';

let environment: Environment | null;

const listeners: Array<() => void> = [];
export const getRelayEnvironment = () => {
  if (!environment) {
    environment = createRelayEnvironment({
      fetchFunction: fetchWithGlobalEvents(fetchWithAuthTokens(fetchJSON)),
    });
    addAuthStateListener(resetEnvironment);
  }
  return environment;
};

const resetEnvironment = (state: AuthState) => {
  environment?.commitUpdate(store => {
    store.getRoot().getLinkedRecord('viewer')?.invalidateRecord();
    if (!state.authenticated) {
      store.getRoot().getLinkedRecord('currentUser')?.invalidateRecord();

      //TODO remove this when we have a better way to manage active queries (see issues #612 and #591)
      clearActiveQueries();
    }
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
