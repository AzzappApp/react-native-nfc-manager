import { useEffect, useState } from 'react';
import { loadQuery } from 'react-relay';
import { createOperationDescriptor, getRequest } from 'relay-runtime';
import {
  addEnvironmentListener,
  getRelayEnvironment,
} from './relayEnvironment';
import type { GraphQLTaggedNode, PreloadedQuery, Variables } from 'react-relay';
import type { ReaderLinkedField } from 'relay-runtime';

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
    useViewer: boolean;
  }
>();

/**
 * A map of listeners, indexed by screenId
 */
const listeners = new Map<string, Array<() => void>>();

/**
 * Add a listener for a query status change
 * The listener will be called when the query changes (create/refresh)
 *
 * @param screenId
 * @param listener
 * @returns
 */
const addListener = (screenId: string, listener: () => void) => {
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
  addEnvironmentListener(kind => {
    switch (kind) {
      case 'invalidateViewer':
        refreshQueries();
        break;
      case 'reset':
        resetQueries();
        break;
    }
  });
};

let refreshQueryTimeout: any = null;
const refreshQueries = () => {
  clearTimeout(refreshQueryTimeout);
  // avoid some race conditions
  refreshQueryTimeout = setTimeout(() => {
    [...activeQueries.entries()].forEach(([screenId, entry]) => {
      const {
        query,
        variables,
        useViewer,
        preloadedQuery: previousPreloadedQuery,
      } = entry;

      if (useViewer) {
        entry.preloadedQuery = loadQuery(
          getRelayEnvironment(),
          query,
          variables,
        );
        listeners.get(screenId)?.forEach(listener => listener());
        setTimeout(() => {
          previousPreloadedQuery.dispose();
        }, 0);
      }
    });
  }, 50);
};

let resetTimeout: any = null;
const resetQueries = () => {
  clearTimeout(resetTimeout);
  clearTimeout(refreshQueryTimeout);
  // avoid some race conditions
  resetTimeout = setTimeout(() => {
    [...activeQueries.entries()].forEach(([, entry]) => {
      entry.preloadedQuery.dispose();
    });
    activeQueries.clear();
    for (const screenListeners of listeners.values()) {
      screenListeners.forEach(listener => listener());
    }
  }, 50);
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
export type LoadQueryOptions<TParams> = {
  /**
   * The query to load, can be a static query or a function that returns a query
   * based on the params of the screen route
   */
  query: GraphQLTaggedNode | ((params: TParams) => GraphQLTaggedNode);
  /**
   * A function that returns the variables of the query based on the params of the screen route
   * @param params
   * @returns the query variables
   */
  getVariables?: (params: TParams) => Variables;
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

    const operation = createOperationDescriptor(getRequest(query), variables);
    const useViewer = operation.fragment.node.selections.some(
      selection =>
        selection.kind === 'LinkedField' &&
        (selection as ReaderLinkedField).name === 'viewer',
    );

    const preloadedQuery = loadQuery(getRelayEnvironment(), query, variables);
    activeQueries.set(screenId, {
      query,
      preloadedQuery,
      variables,
      useViewer,
    });
    listeners.get(screenId)?.forEach(listener => listener());
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
