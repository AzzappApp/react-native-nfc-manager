import { createContext, useCallback, useContext } from 'react';
import { getAuthState } from './authStore';
import fetchQueryAndRetain from './fetchQueryAndRetain';
import type { ROUTES, Route } from '#routes';
import type { ProfileInfos } from './authStore';
import type { Disposable, Environment } from 'react-relay';
import type { Observable, Variables, GraphQLTaggedNode } from 'relay-runtime';

export type ScreenPrefetchOptions<TRoute extends Route> = {
  /**
   * Function used to prefetch data for a given route
   * @param route The route to prefetch
   */
  prefetch?: (
    route: TRoute,
    environment: Environment,
    profileInfos: ProfileInfos | null,
  ) => Observable<any> | null | undefined;
  /**
   * The query to load, can be a static query or a function that returns a query
   * based on the params of the screen route
   */
  query?: GraphQLTaggedNode | ((params: TRoute['params']) => GraphQLTaggedNode);
  /**
   * A function that returns the variables of the query based on the params of the screen route
   * @param params
   * @returns the query variables
   */
  getVariables?: (
    params: TRoute['params'],
    profileInfos: ProfileInfos | null,
  ) => Variables;
};

/**
 * A screen prefetcher is used to prefetch data and images for screens
 */
type ScreenPrefetcher = {
  /**
   * Prefetches data and images for a given route
   * The prefetcher will retain a subscription to the observable returned by the prefetch function until
   * the screen initiating the prefetch is dismissed
   *
   * @param intiatorId The id of the screen initiating the prefetch
   * @param route The route to prefetch
   */
  prefetchRoute: (environment: Environment, route: Route) => Disposable;
};

/**
 * Creates a screen prefetcher that will prefetch screens data and images
 * It retains a subscription to the observable returned by the prefetch function until
 * the screen initiating the prefetch is dismissed
 *
 * @param screens
 * @returns
 */
export const createScreenPrefetcher = (
  screens: Record<ROUTES, ScreenPrefetchOptions<Route>>,
): ScreenPrefetcher => {
  const prefetchRoute = (environment: Environment, route: Route) => {
    // return
    const Component = screens[route.route];
    let observable: Observable<any> | null | undefined = null;
    const profileInfos = getAuthState().profileInfos;

    if (Component.prefetch) {
      observable = Component.prefetch(route, environment, profileInfos);
    } else if (Component.query) {
      const query =
        typeof Component.query === 'function'
          ? Component.query(route.params)
          : Component.query;

      observable = fetchQueryAndRetain(
        environment,
        query,
        Component.getVariables?.(route.params, profileInfos) ?? ({} as any),
        {
          fetchPolicy: 'network-only',
        },
      );
    }

    if (!observable) {
      return {
        dispose: () => {},
      };
    }
    const subscription = observable.subscribe({
      error: (error: any) => {
        const stringParams = JSON.stringify(route.params, undefined, 2);
        console.warn(
          `Error preloading route ${route.route} with params ${stringParams}, error: ${error}`,
        );
        if (subscription) {
          subscription.unsubscribe();
        }
      },
    });

    return {
      dispose: () => {
        subscription.unsubscribe();
      },
    };
  };

  return {
    prefetchRoute,
  };
};

const ScreenPrefetcherContext = createContext<ScreenPrefetcher | null>(null);

/**
 * Provider used to provide a reference to the screen prefetcher
 */
export const ScreenPrefetcherProvider =
  ScreenPrefetcherContext.Provider as React.Provider<ScreenPrefetcher>;

/**
 * Hook used to retrieve a reference to the screen prefetcher prefetchRoute function
 * contextualized to the current rendered screen
 *
 * @returns A function that can be used to prefetch data and images for a given route
 */
export const usePrefetchRoute = () => {
  const screenPrefetcher = useContext(ScreenPrefetcherContext);
  if (!screenPrefetcher) {
    throw new Error(
      'useScreenPrefetcher must be used within a ScreenPrefetcherProvider',
    );
  }

  return useCallback(
    (environment: Environment, route: Route) => {
      return screenPrefetcher.prefetchRoute(environment, route);
    },
    [screenPrefetcher],
  );
};
