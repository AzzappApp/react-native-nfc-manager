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
  screenId: string,
  listener: (query: PreloadedQuery<any>) => void,
) => {
  if (!listeners.has(screenId)) {
    listeners.set(screenId, []);
  }
  listeners.get(screenId)?.push(listener);

  return () => {
    const screenIdListeners = listeners.get(screenId)!;
    const index = screenIdListeners.indexOf(listener);
    if (index !== -1) {
      screenIdListeners.splice(index, 1);
      if (screenIdListeners.length === 0) {
        listeners.delete(screenId);
      }
    }
  };
};

export const init = () => {
  addEnvironmentListener(() => {
    [...activeQueries.entries()].forEach(([screenId, entry]) => {
      const { preloadedQuery, query, variables } = entry;
      preloadedQuery.dispose();
      entry.preloadedQuery = loadQuery(getRelayEnvironment(), query, variables);
      listeners
        .get(screenId)
        ?.forEach(callback => callback(entry.preloadedQuery));
    });
  });
};

export const useQueryLoaderQuery = (screenId: string) => {
  const [queryInfos, setQueryInfos] = useState(
    activeQueries.get(screenId)?.preloadedQuery,
  );
  useEffect(
    () =>
      addListener(screenId, () => {
        setQueryInfos(activeQueries.get(screenId)?.preloadedQuery);
      }),
    [screenId],
  );
  return queryInfos ?? null;
};

export type LoadQueryOptions<T> = {
  query: GraphQLTaggedNode | ((params: T) => GraphQLTaggedNode);
  getVariables?: (params: T) => Variables;
};

export const loadQueryFor = <T>(
  screenId: string,
  options: LoadQueryOptions<T>,
  params: T = {} as T,
  refresh = false,
) => {
  if (!activeQueries.has(screenId) || refresh) {
    const query =
      typeof options.query === 'function'
        ? options.query(params)
        : options.query;
    const variables = options.getVariables?.(params) ?? {};
    const preloadedQuery = loadQuery(getRelayEnvironment(), query, variables);
    activeQueries.set(screenId, { query, preloadedQuery, variables });
    listeners.get(screenId)?.forEach(callback => callback(preloadedQuery));
  }
};

export const disposeQueryFor = (screenId: string) => {
  const query = activeQueries.get(screenId);
  if (query) {
    query.preloadedQuery.dispose();
    activeQueries.delete(screenId);
  }
};
