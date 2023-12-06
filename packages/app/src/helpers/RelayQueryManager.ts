import { useEffect, useState } from 'react';
import { loadQuery } from 'react-relay';
import { addAuthStateListener, getAuthState } from './authStore';
import {
  ROOT_ACTOR_ID,
  addEnvironmentListener,
  getRelayEnvironment,
} from './relayEnvironment';
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
    variables: Variables;
    query: GraphQLTaggedNode;
    actorId?: string;
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
      case 'reset':
        resetQueries();
        break;
    }
  });
  let currentWebCardId = getAuthState().webCardId;
  addAuthStateListener(({ webCardId }) => {
    if (webCardId !== currentWebCardId) {
      currentWebCardId = webCardId;
      refreshQueries();
    }
  });
};

let refreshTimeout: any = null;
const refreshQueries = () => {
  clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(() => {
    const webCardId = getAuthState().webCardId;
    for (const [screenId, entry] of activeQueries.entries()) {
      if (entry.actorId !== webCardId && entry.actorId !== ROOT_ACTOR_ID) {
        const oldPreloadedQuery = entry.preloadedQuery;
        const multiActorEnvironment = getRelayEnvironment();
        const actorId = webCardId ?? ROOT_ACTOR_ID;
        const newPreloadedQuery = loadQuery(
          multiActorEnvironment.forActor(actorId),
          entry.query,
          entry.variables,
        );
        entry.preloadedQuery = newPreloadedQuery;
        entry.actorId = actorId;
        listeners.get(screenId)?.forEach(listener => listener());
        requestIdleCallback(() => {
          oldPreloadedQuery.dispose();
        });
      }
    }
  }, 30);
};

let resetTimeout: any = null;
const resetQueries = () => {
  clearTimeout(resetTimeout);
  clearTimeout(refreshTimeout);
  // avoid some race conditions
  resetTimeout = setTimeout(() => {
    [...activeQueries.entries()].forEach(([, entry]) => {
      entry.preloadedQuery.dispose();
    });
    activeQueries.clear();
    for (const screenListeners of listeners.values()) {
      screenListeners.forEach(listener => listener());
    }
  }, 20);
};

/**
 * Return the relay preloaded query associated with a given screen
 * @param screenId the screen id
 * @returns a preloaded query or null if the query is not in the cache
 */
export const useManagedQuery = (screenId: string) => {
  const [queryInfos, setQueryInfos] = useState(() => {
    const { preloadedQuery, actorId } = activeQueries.get(screenId) ?? {};
    return preloadedQuery && actorId ? { preloadedQuery, actorId } : null;
  });
  useEffect(
    () =>
      addListener(screenId, () => {
        setQueryInfos(() => {
          const { preloadedQuery, actorId } = activeQueries.get(screenId) ?? {};
          return preloadedQuery && actorId ? { preloadedQuery, actorId } : null;
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
  getVariables?: (params: TParams) => Variables;
  /**
   * If true, the query will be bound to the current webCard
   */
  webCardBound?: boolean | ((params: TParams) => boolean);
  /**
   * The request fetch policy
   */
  fetchPolicy?: FetchPolicy | null | undefined;
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

    const multiActorEnvironment = getRelayEnvironment();
    const actorId =
      (options.webCardBound && getAuthState().webCardId) || ROOT_ACTOR_ID;

    const preloadedQuery = loadQuery(
      multiActorEnvironment.forActor(actorId),
      query,
      variables,
      { fetchPolicy: options.fetchPolicy },
    );
    activeQueries.set(screenId, {
      query,
      preloadedQuery,
      variables,
      actorId,
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
