import { useEffect, useState } from 'react';
import { Navigation } from 'react-native-navigation';
import { loadQuery } from 'react-relay';
import {
  addEnvironmentListener,
  getRelayEnvironment,
} from './relayEnvironment';
import type { GraphQLTaggedNode, PreloadedQuery, Variables } from 'react-relay';

type QueryEntry = {
  query: GraphQLTaggedNode;
  getVariables?: (params: any) => Variables;
};

const queryRegistry = new Map<string, QueryEntry>();

const activeQuery = new Map<
  string,
  {
    preloadedQuery: PreloadedQuery<any>;
    variables: Variables;
    query: GraphQLTaggedNode;
  }
>();

const listeners = new Map<
  string,
  Array<(query: PreloadedQuery<any>) => void>
>();

const addListener = (
  componentId: string,
  listener: (query: PreloadedQuery<any>) => void,
) => {
  if (!listeners.has(componentId)) {
    listeners.set(componentId, []);
  }
  listeners.get(componentId)?.push(listener);

  return () => {
    const componentIdListeners = listeners.get(componentId)!;
    const index = componentIdListeners.indexOf(listener);
    if (index !== -1) {
      componentIdListeners.splice(index, 1);
      if (componentIdListeners.length === 0) {
        listeners.delete(componentId);
      }
    }
  };
};

export const init = () => {
  Navigation.events().registerCommandListener((name: string, params: any) => {
    switch (name) {
      case 'push': {
        const {
          layout: {
            id: componentId,
            type,
            data: { name: componentName, passProps },
          },
        } = params;
        if (type === 'Component') {
          loadQueryFor(componentId, componentName, passProps.params);
        }
        break;
      }
      case 'pop': {
        const { componentId } = params;
        disposeQueryFor(componentId);
        break;
      }
      default:
        return;
    }
  });
  addEnvironmentListener(() => {
    [...activeQuery.entries()].forEach(([componentId, entry]) => {
      const { preloadedQuery, query, variables } = entry;
      preloadedQuery.dispose();
      entry.preloadedQuery = loadQuery(getRelayEnvironment(), query, variables);
      listeners
        .get(componentId)
        ?.forEach(callback => callback(entry.preloadedQuery));
    });
  });
};

export const registerComponentQuery = (
  componentName: string,
  query: QueryEntry,
) => {
  queryRegistry.set(componentName, query);
};

export const useQueryLoaderQuery = (componentId: string) => {
  const [query, setQuery] = useState<PreloadedQuery<any> | null>(
    activeQuery.get(componentId)?.preloadedQuery ?? null,
  );
  useEffect(() => addListener(componentId, setQuery), [componentId]);
  return query;
};

export const loadQueryFor = (
  componentId: string,
  componentName: string,
  params?: any,
  refresh?: boolean,
) => {
  const entry = queryRegistry.get(componentName);
  if (entry && (!activeQuery.has(componentId) || refresh)) {
    const { query, getVariables } = entry;
    const variables = getVariables?.(params) ?? {};
    const preloadedQuery = loadQuery(getRelayEnvironment(), query, variables);
    activeQuery.set(componentId, { query, preloadedQuery, variables });
    listeners.get(componentId)?.forEach(callback => callback(preloadedQuery));
  }
};

export const disposeQueryFor = (componentId: string) => {
  const query = activeQuery.get(componentId);
  if (query) {
    query.preloadedQuery.dispose();
    activeQuery.delete(componentId);
  }
};
