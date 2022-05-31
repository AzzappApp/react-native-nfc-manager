import { useEffect, useState } from 'react';
import { loadQuery } from 'react-relay';
import {
  addEnvironmentListener,
  getRelayEnvironment,
} from './relayEnvironment';
import type { GraphQLTaggedNode, PreloadedQuery, Variables } from 'react-relay';

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

export const useQueryLoaderQuery = (componentId: string) => {
  const [queryInfos, setQueryInfos] = useState(
    activeQueries.get(componentId)?.preloadedQuery,
  );
  useEffect(
    () =>
      addListener(componentId, () =>
        setQueryInfos(activeQueries.get(componentId)?.preloadedQuery),
      ),
    [componentId],
  );
  return queryInfos ?? null;
};

export type LoadQueryOptions<T> = {
  query: GraphQLTaggedNode | ((params: T) => GraphQLTaggedNode);
  getVariables?: (params: T) => Variables;
};

export const loadQueryFor = <T>(
  componentId: string,
  options: LoadQueryOptions<T>,
  params: T = {} as T,
  refresh = false,
) => {
  if (!activeQueries.has(componentId) || refresh) {
    const query =
      typeof options.query === 'function'
        ? options.query(params)
        : options.query;
    const variables = options.getVariables?.(params) ?? {};
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
