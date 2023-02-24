import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import * as WebAPI from '@azzapp/shared/lib/WebAPI';
import Link from '../components/Link';
import { pathToRoute, routeToPath } from '../helpers/routesHelpers';
import type { PlatformEnvironment } from '@azzapp/app/lib/PlatformEnvironment';
import type { Route } from '@azzapp/app/lib/routes';

const useWebPlatformEnvironment = (): PlatformEnvironment => {
  const router = useRouter();
  const routerRef = useRef(router);
  if (routerRef.current !== router) {
    routerRef.current = router;
  }

  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  const willChangeListeners = useRef<Array<(route: Route) => void>>([]);
  const didChangeListeners = useRef<Array<(route: Route) => void>>([]);
  if (pathnameRef.current !== pathname) {
    const route = pathToRoute(pathname!);
    willChangeListeners.current.forEach(listener => listener(route));
  }

  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (!firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    didChangeListeners.current.forEach(listener =>
      listener(pathToRoute(pathname!)),
    );
  }, [pathname]);

  return useMemo(
    () => ({
      router: {
        getCurrentRoute() {
          return pathToRoute(pathnameRef.current!);
        },
        push(route) {
          routerRef.current.push(routeToPath(route));
        },
        replace(route) {
          routerRef.current.replace(routeToPath(route));
        },
        showModal(route) {
          console.error('Show modal does not work on web');
          routerRef.current.replace(routeToPath(route));
        },
        back() {
          routerRef.current.back();
        },
        addRouteDidChangeListener(callbak) {
          didChangeListeners.current.push(callbak);
          return {
            dispose() {
              const index = didChangeListeners.current.indexOf(callbak);
              if (index !== -1) {
                didChangeListeners.current.splice(index, 1);
              }
            },
          };
        },
        addRouteWillChangeListener(callbak) {
          willChangeListeners.current.push(callbak);
          return {
            dispose() {
              const index = willChangeListeners.current.indexOf(callbak);
              if (index !== -1) {
                willChangeListeners.current.splice(index, 1);
              }
            },
          };
        },
      },
      LinkComponent: Link,
      WebAPI: {
        ...WebAPI,
        refreshTokens: () => Promise.resolve({} as any),
      },
    }),
    [],
  );
};

export default useWebPlatformEnvironment;
