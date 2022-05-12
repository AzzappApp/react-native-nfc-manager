import { useEffect, useState } from 'react';
import { Navigation } from 'react-native-navigation';
import { loadQuery } from 'react-relay';
import {
  addEnvironmentListener,
  getRelayEnvironment,
} from './relayEnvironment';
import type { GraphQLTaggedNode, PreloadedQuery, Variables } from 'react-relay';

type QueryEntry = {
  query: GraphQLTaggedNode | ((params: any) => GraphQLTaggedNode);
  getVariables?: (params: any) => Variables;
};

const queryRegistry = new Map<string, QueryEntry>();

const activeQueries = new Map<
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
    [...activeQueries.entries()].forEach(([componentId, entry]) => {
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

const getQueryInfos = (componentId: string) => {
  const entry = activeQueries.get(componentId);
  return entry ? ([entry?.query, entry?.preloadedQuery] as const) : null;
};

export const useQueryLoaderQuery = (componentId: string) => {
  const [queryInfos, setQueryInfos] = useState(getQueryInfos(componentId));
  useEffect(
    () =>
      addListener(componentId, () => setQueryInfos(getQueryInfos(componentId))),
    [componentId],
  );
  return queryInfos;
};

export const loadQueryFor = (
  componentId: string,
  componentName: string,
  params?: any,
  refresh?: boolean,
) => {
  const entry = queryRegistry.get(componentName);
  if (entry && (!activeQueries.has(componentId) || refresh)) {
    const { query: queryOrFactory, getVariables } = entry;
    const variables = getVariables?.(params) ?? {};
    const query =
      typeof queryOrFactory === 'function'
        ? queryOrFactory(params)
        : queryOrFactory;
    const preloadedQuery = loadQuery(getRelayEnvironment(), query, variables);
    activeQueries.set(componentId, { query, preloadedQuery, variables });
    listeners.get(componentId)?.forEach(callback => callback(preloadedQuery));
  }
};

export const disposeQueryFor = (componentId: string) => {
  const query = activeQueries.get(componentId);
  if (query) {
    query.preloadedQuery.dispose();
    activeQueries.delete(componentId);
  }
};
