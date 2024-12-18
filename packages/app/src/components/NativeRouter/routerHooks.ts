import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { createDeferred } from '@azzapp/shared/asyncHelpers';
import useLatestCallback from '#hooks/useLatestCallback';
import { RouterContext, ScreenRendererContext } from './routerContexts';
import type { NativeNavigationEvent } from './routerTypes';

export const useRouter = () => {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error('Missing router context');
  }
  return router;
};

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

export const useNativeNavigationEvent = (
  event: NativeNavigationEvent,
  handler: () => void,
) => {
  if (Platform.OS !== 'ios') {
    console.warn(
      'useNativeNavigationEvent is buggy on Android, use it with caution',
    );
  }
  const { navigationEventEmitter } = useContext(ScreenRendererContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const listener = () => {
      handlerRef.current();
    };
    navigationEventEmitter.addListener(event, listener);
    return () => {
      navigationEventEmitter.removeListener(event, listener);
    };
  }, [event, navigationEventEmitter]);
};

export const useScreenOptionsUpdater = () => {
  const { setOptions } = useContext(ScreenRendererContext);
  return setOptions;
};

export const useCurrentScreenID = () => {
  const { id } = useContext(ScreenRendererContext);
  return id;
};

export const useScreenHasFocus = () => {
  const { hasFocus } = useContext(ScreenRendererContext);
  return hasFocus;
};

export const useOnFocus = (handler: (() => void) | null) => {
  const hasFocus = useScreenHasFocus();
  const funcRef = useRef(handler);
  funcRef.current = handler;
  useEffect(() => {
    if (hasFocus) {
      funcRef.current?.();
    }
  }, [hasFocus]);
};

export const useRouteWillChange = (route: string, cb: () => void) => {
  const router = useRouter();

  useEffect(() => {
    const { dispose } = router.addRouteWillChangeListener(routeEvent => {
      if (routeEvent.route === route) cb();
    });

    return dispose;
  });
};

export const useModalInterceptor = (callback: () => Promise<void>) => {
  const router = useRouter();
  const latestCallback = useLatestCallback(callback);
  useEffect(() => {
    router.addModalInterceptor(() => latestCallback());
  }, [latestCallback, router]);
};

export const useDidAppear = () => {
  const { didAppear } = useContext(ScreenRendererContext);
  return didAppear;
};

export const useSuspendUntilAppear = (enabled = true) => {
  const didAppear = useDidAppear();
  const deferred = useMemo(() => createDeferred<boolean>(), []);
  useEffect(() => {
    if (didAppear || !enabled) {
      deferred.resolve(true);
    }
  }, [didAppear, deferred, enabled]);
  if (!didAppear && enabled) {
    throw deferred.promise;
  }
};
