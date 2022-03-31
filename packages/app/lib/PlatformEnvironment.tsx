import { createContext, useContext, useEffect, useState } from 'react';
import type { Routes } from '@azzapp/shared/lib/routes';
import type * as WebAPI from '@azzapp/shared/lib/WebAPI';
import type { PressableProps } from 'react-native';

export type PlatformEnvironment = {
  router: Router;
  LinkComponent: React.ComponentType<LinkProps>;
  launchImagePicker(): Promise<{
    file?: File;
    uri?: string;
    error?: Error;
    didCancel?: boolean;
  }>;

  WebAPI: typeof WebAPI;
};

export type Router = {
  push(route: Routes, params?: any, options?: any): void;
  replace(route: Routes, params?: any, options?: any): void;
  showModal(route: Routes, params?: any, options?: any): void;
  back(options?: any): void;
  getCurrenRoute(): { route: Routes; params: any };
  addRouteWillChangeListener: (
    listener: (route: Routes, params: any) => void,
  ) => {
    dispose(): void;
  };
  addRouteDidChangeListener: (
    listener: (route: Routes, params: any) => void,
  ) => {
    dispose(): void;
  };
};

export type LinkProps = PressableProps & {
  route: Routes;
  replace?: boolean;
  modal?: boolean;
  params?: any;
  options?: any;
};

const PlatformEnvironmentContext = createContext<PlatformEnvironment>(
  null as any,
);

export const PlatformEnvironmentProvider = PlatformEnvironmentContext.Provider;

export const usePlatformEnvironment = () =>
  useContext(PlatformEnvironmentContext);

export const useImagePicker = () =>
  useContext(PlatformEnvironmentContext).launchImagePicker;

export const useRouter = () => useContext(PlatformEnvironmentContext).router;

export const useWebAPI = () => useContext(PlatformEnvironmentContext).WebAPI;

export const useCurrentRoute = (
  usedEvent: 'didChange' | 'willChange' = 'willChange',
) => {
  const router = useRouter();
  const [currentRoute, setCurrentRoute] = useState(router.getCurrenRoute());
  useEffect(() => {
    let subscription: { dispose(): void };

    if (usedEvent === 'willChange') {
      subscription = router.addRouteWillChangeListener((route, params) => {
        setCurrentRoute({ route, params });
      });
    } else {
      subscription = router.addRouteDidChangeListener((route, params) => {
        setCurrentRoute({ route, params });
      });
    }

    return () => {
      subscription?.dispose();
    };
  }, [router, usedEvent]);

  return currentRoute;
};
