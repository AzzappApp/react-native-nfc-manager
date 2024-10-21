import { useEffect, useState } from 'react';
import { loadQuery } from 'react-relay';
import { getAuthState } from './authStore';
import {
  addEnvironmentListener,
  getRelayEnvironment,
} from './relayEnvironment';
import type { ProfileInfos } from './authStore';
import type {
  FetchPolicy,
  GraphQLTaggedNode,
  PreloadedQuery,
  Variables,
} from 'react-relay';

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
    options: LoadQueryOptions<any>;
    params: any;
  }
>();

/**
 * A list of queries to dispose
 */
const queryToDisposes: Array<PreloadedQuery<any>> = [];

/**
 * Schedule the disposal of the queries thar are not used anymore
 * it will be effective during the next idle time
 */
const requestDisposeQueries = () => {
  requestIdleCallback(() => {
    queryToDisposes.forEach(query => {
      query.dispose();
    });
    queryToDisposes.length = 0;
  });
};

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
      case 'reset':
        resetQueries();
        break;
    }
  });
};

let resetTimeout: any = null;
const resetQueries = () => {
  clearTimeout(resetTimeout);
  // avoid some race conditions
  resetTimeout = setTimeout(() => {
    [...activeQueries.entries()].forEach(([, entry]) => {
      queryToDisposes.push(entry.preloadedQuery);
    });
    activeQueries.clear();
    for (const screenListeners of listeners.values()) {
      screenListeners.forEach(listener => listener());
    }
    resetTimeout = null;
    requestDisposeQueries();
  }, 20);
};

/**
 * Return the relay preloaded query associated with a given screen
 * @param screenId the screen id
 * @returns a preloaded query or null if the query is not in the cache
 */
export const useManagedQuery = (screenId: string) => {
  const [queryInfos, setQueryInfos] = useState(() => {
    const { preloadedQuery } = activeQueries.get(screenId) ?? {};
    return preloadedQuery ? { preloadedQuery } : null;
  });
  useEffect(
    () =>
      addListener(screenId, () => {
        setQueryInfos(() => {
          const { preloadedQuery } = activeQueries.get(screenId) ?? {};
          return preloadedQuery ? { preloadedQuery } : null;
        });
      }),
    [screenId],
  );

  return queryInfos;
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
  getVariables?: (
    params: TParams,
    profileInfos: ProfileInfos | null,
  ) => Variables;
  /**
   * The request fetch policy
   */
  fetchPolicy?: FetchPolicy | null | undefined;

  /**
   * If true, the query will be cached on the device and reused the next time the screen is displayed
   */
  useOfflineCache?: boolean;

  /**
   * If true, the query will be fetched only from the cache if available
   */
  cacheOnly?: boolean;
};

/**
 * Return the query and variables for a given set of LoadQueryOptions and route params
 * @param options
 * @param params
 * @returns
 */
export const getLoadQueryInfo = <T>(
  options: LoadQueryOptions<T>,
  params: T = {} as T,
  profileInfos: ProfileInfos | null = null,
) => {
  const query =
    typeof options.query === 'function' ? options.query(params) : options.query;
  const variables = options.getVariables?.(params, profileInfos) ?? {};

  return { query, variables };
};

/**
 * Preload a query for a given screen
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
    const environment = getRelayEnvironment();
    const { profileInfos } = getAuthState();
    const { query, variables } = getLoadQueryInfo(
      options,
      params,
      profileInfos,
    );
    const { useOfflineCache, cacheOnly } = options;

    const preloadedQuery = loadQuery(environment, query, variables, {
      fetchPolicy: options.fetchPolicy ?? 'store-and-network',
      networkCacheConfig: {
        metadata: {
          useOfflineCache,
          cacheOnly,
        },
      },
    });
    activeQueries.set(screenId, {
      preloadedQuery,
      options,
      params,
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
    listeners.get(screenId)?.forEach(listener => listener());
  }
};
