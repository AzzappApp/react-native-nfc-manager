import { useEffect, useState } from 'react';
import { loadQuery } from 'react-relay';
import {
  addEnvironmentListener,
  getRelayEnvironment,
} from './relayEnvironment';
import type { GraphQLTaggedNode, PreloadedQuery, Variables } from 'react-relay';

/**
 * This module is used to load and dispose queries for a given screen.
 * It is used to manage the lifecycle of the relay queries, during the navigation.
 */

/**
 * A map of active queries, indexed by screenId
 */
const activeQueries = new Map<
  string,
  {
    preloadedQuery: PreloadedQuery<any>;
    variables: Variables;
    query: GraphQLTaggedNode;
  }
>();

/**
 * A map of listeners, indexed by screenId
 */
const listeners = new Map<
  string,
  Array<(query: PreloadedQuery<any>) => void>
>();

/**
 * Add a listener for a query status change
 * The listener will be called when the query changes (create/refresh)
 *
 * @param screenId
 * @param listener
 * @returns
 */
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

/**
 * Initialize the query manager
 */
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

/**
 * Return the relay preloaded query associated with a given screen
 * @param screenId the screen id
 * @returns a preloaded query or null if the query is not in the cache
 */
export const useManagedQuery = (screenId: string) => {
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

/**
 * Query options
 */
export type LoadQueryOptions<T> = {
  /**
   * The query to load, can be a static query or a function that returns a query
   * based on the params of the screen route
   */
  query: GraphQLTaggedNode | ((params: T) => GraphQLTaggedNode);
  /**
   * A function that returns the variables of the query based on the params of the screen route
   * @param params
   * @returns the query variables
   */
  getVariables?: (params: T) => Variables;
};

/**
 * Preloload a query for a given screen
 * @param screenId screen id
 * @param options query options
 * @param params the route params
 * @param refresh if true, the query will be refreshed even if it is already loaded
 */
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

/**
 * Dispose the query for a given screen
 * @param screenId
 */
export const disposeQueryFor = (screenId: string) => {
  const query = activeQueries.get(screenId);
  if (query) {
    query.preloadedQuery.dispose();
    activeQueries.delete(screenId);
  }
};
