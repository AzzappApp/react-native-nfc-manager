import { createContext, useCallback, useContext } from 'react';
import { createOperationDescriptor, getRequest } from 'relay-runtime';
import { useCurrentScreenID } from '#components/NativeRouter';
import fetchQueryAndRetain from './fetchQueryAndRetain';
import {
  addEnvironmentListener,
  getRelayEnvironment,
} from './relayEnvironment';
import type { ROUTES, Route } from '#routes';
import type {
  Observable,
  Subscription,
  Variables,
  GraphQLTaggedNode,
  ReaderLinkedField,
} from 'relay-runtime';

export type ScreenPrefetchOptions<TRoute extends Route> = {
  /**
   * Function used to prefetch data for a given route
   * @param route The route to prefetch
   */
  prefetch?: (route: TRoute) => Observable<any> | null | undefined;
  /**
   * If true, the prefetcher won't refresh the data when the profile changes
   */
  prefetchProfileIndependent?: boolean;
  /**
   * Function used to list routes to prefetch when a screen is pushed
   * @param route The route that was pushed
   * @returns An array of routes to prefetch
   */
  getRoutesToPrefetch?: (route: Route) => Route[];

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
  getVariables?: (params: TRoute['params']) => Variables;
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
  prefetchRoute: (intiatorId: string, route: Route) => void;

  /**
   * A callback that should be called when a screen is dismissed
   * @param id  The id of the screen that was dismissed
   */
  screenWillBeRemoved: (id: string) => void;

  /**
   * A callback that should be called when a screen is pushed
   * @param id The id of the screen that was pushed
   * @param route  The route that was pushed
   * @returns An array of routes to prefetch
   */
  screenWillBePushed: (id: string, route: Route) => void;

  /**
   * Returns the number of active subscriptions
   * @param screenId The id of the screen
   */
  getActiveSubscriptionCount: (screenId: string) => number;
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
  initialRoute: Route,
  initialScreenId: string,
): ScreenPrefetcher => {
  const screenSubscriptions = new Map<
    string,
    Array<{ subscription: Subscription; route: Route; useViewer: boolean }>
  >();

  const prefetchRoute = (intiatorId: string, route: Route) => {
    const Component = screens[route.route];
    let useViewer = false;
    let observable: Observable<any> | null | undefined = null;

    if (Component.prefetch) {
      observable = Component.prefetch(route);
      useViewer = !Component.prefetchProfileIndependent;
    } else if (Component.query) {
      const query =
        typeof Component.query === 'function'
          ? Component.query(route.params)
          : Component.query;

      const variables = Component.getVariables?.(route.params) ?? ({} as any);

      const operation = createOperationDescriptor(getRequest(query), variables);
      useViewer = operation.fragment.node.selections.some(
        selection =>
          selection.kind === 'LinkedField' &&
          (selection as ReaderLinkedField).name === 'viewer',
      );

      observable = fetchQueryAndRetain(
        getRelayEnvironment(),
        query,
        Component.getVariables?.(route.params) ?? ({} as any),
      );
    }

    if (!observable) {
      return;
    }
    let subscriptions = screenSubscriptions.get(intiatorId);
    if (!subscriptions) {
      subscriptions = [];
      screenSubscriptions.set(intiatorId, subscriptions);
    }
    const subscription = observable.subscribe({
      error: (error: any) => {
        const stringParams = JSON.stringify(route.params, undefined, 2);
        console.warn(
          `Error preloading route ${route.route} with params ${stringParams}, error: ${error}`,
        );
        subscription.unsubscribe();
        const index = subscriptions!.findIndex(
          ({ subscription: s }) => s === subscription,
        );
        if (index !== -1) {
          subscriptions!.splice(index, 1);
        }
      },
      complete: () => {
        const index = subscriptions!.findIndex(
          ({ subscription: s }) => s === subscription,
        );
        if (index !== -1) {
          subscriptions!.splice(index, 1);
        }
      },
    });
    subscriptions.push({
      subscription,
      route,
      useViewer,
    });
  };

  const screenWillBePushed = (id: string, route: Route) => {
    const Component = screens[route.route];
    if (Component?.getRoutesToPrefetch) {
      const routes = Component.getRoutesToPrefetch(route);
      routes.forEach(route => prefetchRoute(id, route));
    }
  };

  const screenWillBeRemoved = (id: string) => {
    const subscriptions = screenSubscriptions.get(id);
    if (subscriptions) {
      subscriptions.forEach(({ subscription }) => subscription.unsubscribe());
      screenSubscriptions.delete(id);
    }
  };

  screenWillBePushed(initialScreenId, initialRoute);

  let refreshQueryTimeout: any = null;
  const refreshQueries = () => {
    clearTimeout(refreshQueryTimeout);
    refreshQueryTimeout = setTimeout(() => {
      for (const [screenId, subscriptions] of screenSubscriptions) {
        subscriptions.forEach(({ subscription, useViewer }) => {
          if (useViewer) {
            subscription.unsubscribe();
            prefetchRoute(screenId, subscriptions[0].route);
          }
        });
      }
    });
  };

  let resetQueryTimeout: any = null;
  const resetQueries = () => {
    clearTimeout(resetQueryTimeout);
    resetQueryTimeout = setTimeout(() => {
      screenSubscriptions.forEach(subscriptions => {
        subscriptions.forEach(({ subscription }) => {
          subscription.unsubscribe();
        });
      });
      screenSubscriptions.clear();
    }, 50);
  };

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

  return {
    prefetchRoute,
    screenWillBePushed,
    screenWillBeRemoved,
    getActiveSubscriptionCount: screenId =>
      screenSubscriptions.get(screenId)?.length ?? 0,
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
  const screenId = useCurrentScreenID();

  if (!screenId) {
    throw new Error(
      'useScreenPrefetcher must be used on native platforms only',
    );
  }

  const screenPrefetcher = useContext(ScreenPrefetcherContext);
  if (!screenPrefetcher) {
    throw new Error(
      'useScreenPrefetcher must be used within a ScreenPrefetcherProvider',
    );
  }

  return useCallback(
    (route: Route) => {
      screenPrefetcher.prefetchRoute(screenId, route);
    },
    [screenId, screenPrefetcher],
  );
};
