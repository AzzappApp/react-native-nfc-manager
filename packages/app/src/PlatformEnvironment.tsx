import { createContext, useContext, useEffect, useState } from 'react';
import type { Route } from './routes';
import type * as WebAPI from '@azzapp/shared/WebAPI';
import type { ReactElement } from 'react';

export type PlatformEnvironment = {
  router: Router;
  LinkComponent: React.ComponentType<LinkProps>;
  WebAPI: typeof WebAPI;
};

export type RouteListener = (route: Route) => void;

export type Router = {
  push<T extends Route>(route: T): void;
  replace(route: Route): void;
  showModal(route: Route): void;
  back(): void;
  getCurrentRoute(): Route;
  addRouteWillChangeListener: (listener: RouteListener) => {
    dispose(): void;
  };
  addRouteDidChangeListener: (listener: RouteListener) => {
    dispose(): void;
  };
};

export type LinkProps = Route & {
  replace?: boolean;
  modal?: boolean;
  children: ReactElement;
};

const PlatformEnvironmentContext = createContext<PlatformEnvironment>(
  null as any,
);

export const PlatformEnvironmentProvider = PlatformEnvironmentContext.Provider;

export const usePlatformEnvironment = () =>
  useContext(PlatformEnvironmentContext);

export const useRouter = () => useContext(PlatformEnvironmentContext).router;

export const useWebAPI = () => useContext(PlatformEnvironmentContext).WebAPI;

export const useCurrentRoute = (
  usedEvent: 'didChange' | 'willChange' = 'willChange',
) => {
  const router = useRouter();
  const [currentRoute, setCurrentRoute] = useState(router.getCurrentRoute());
  useEffect(() => {
    let subscription: { dispose(): void };

    if (usedEvent === 'willChange') {
      subscription = router.addRouteWillChangeListener(route => {
        setCurrentRoute(route);
      });
    } else {
      subscription = router.addRouteDidChangeListener(route => {
        setCurrentRoute(route);
      });
    }

    return () => {
      subscription?.dispose();
    };
  }, [router, usedEvent]);

  return currentRoute;
};
