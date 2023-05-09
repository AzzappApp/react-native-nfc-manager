import { createContext, useCallback, useContext } from 'react';
import { useCurrentScreenID } from '#components/NativeRouter';
import type { ROUTES, Route } from '#routes';
import type { Observable, Subscription } from 'relay-runtime';

export type ScreenPrefetchOptions = {
  /**
   * Function used to prefetch data for a given route
   * @param route The route to prefetch
   */
  prefetch?: <TRoute extends Route>(
    route: TRoute,
  ) => Observable<any> | null | undefined;
  /**
   * Function used to list routes to prefetch when a screen is pushed
   * @param route The route that was pushed
   * @returns An array of routes to prefetch
   */
  getRoutesToPrefetch?: (route: Route) => Route[];
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
  screens: Record<ROUTES, ScreenPrefetchOptions>,
): ScreenPrefetcher => {
  const screenSubscriptions = new Map<
    string,
    Array<{ subscription: Subscription; route: Route }>
  >();

  const prefetchRoute = (intiatorId: string, route: Route) => {
    const Component = screens[route.route];
    if (Component.prefetch) {
      const observable = Component.prefetch(route);
      if (!observable) {
        return;
      }
      let subscriptions = screenSubscriptions.get(intiatorId);
      if (!subscriptions) {
        subscriptions = [];
        screenSubscriptions.set(intiatorId, subscriptions);
      }
      const subscription = observable.subscribe({
        error: () => {
          const stringParams = JSON.stringify(route.params, undefined, 2);
          console.warn(
            `Error preloading route ${route.route} with params ${stringParams}`,
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
      });
    }
  };

  const screenWillBePushed = (id: string, route: Route) => {
    const Component = screens[route.route];
    if (Component.getRoutesToPrefetch) {
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
