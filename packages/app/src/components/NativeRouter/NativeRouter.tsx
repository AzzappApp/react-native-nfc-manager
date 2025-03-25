import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useReducer,
  startTransition,
} from 'react';
import { BackHandler } from 'react-native';
import { type Route, isRouteEqual } from '#routes';
import { createId } from '#helpers/idHelpers';
import nativeRouterReducer from './nativeRouterReducer';
import {
  dispatchToListeners,
  getActiveTabs,
  getAllRoutesFromStack,
  getCurrentRouteFromState,
} from './routerHelper';
import type {
  BasicRoute,
  ModalDescriptor,
  RouteInit,
  RouterAction,
  RouterInit,
  RouterState,
  StackInit,
  StackRoute,
  TabsInit,
  TabsRoute,
} from './routerTypes';
import type { ReactNode } from 'react';

// TODO some use case of TABS usage and screen listener might be wrong

type ScreenListener = (screens: Array<{ id: string; route: Route }>) => void;
type ModalCloseRequestListener = (modalId: string) => boolean;

export type RouteListener = (route: Route) => void;

export type NativeRouter = {
  // state retrieval
  getCurrentRoute(): Route | null;
  getCurrentRouterState(): RouterState | null;
  getCurrentScreenId(): string | null;
  canGoBack(): boolean;

  // navigation
  push<T extends Route>(route: T, allowDuplicate?: boolean): void;
  back(): boolean;
  pop(num: number): void;
  replace(route: Route): void;
  splice(route: Route | null, count: number): void;
  replaceAll(routes: RouterInit): void;
  backToTop(): void;

  // listeners
  addRouteWillChangeListener: (listener: RouteListener) => {
    dispose(): void;
  };
  addRouteDidChangeListener: (listener: RouteListener) => {
    dispose(): void;
  };
  addScreenWillBePushedListener: (listener: ScreenListener) => {
    dispose: () => void;
  };
  addScreenWillBeRemovedListener: (listener: ScreenListener) => {
    dispose: () => void;
  };
  addModalCloseRequestListener: (listener: ModalCloseRequestListener) => {
    dispose: () => void;
  };

  // modals
  showModal(
    route: Omit<ModalDescriptor, 'ownerId'>,
    initialContent: ReactNode,
  ): Promise<void>;
  updateModal(
    modalId: string,
    update: {
      content: ReactNode;
      gestureEnabled: boolean;
      animationType: 'fade' | 'none' | 'slide';
    },
  ): void;
  hideModal(id: string): void;
  addModalInterceptor(callback: () => Promise<void>): () => void;

  // Internal do not use
  __screenDismissed(id: string): void;
};

export const useNativeRouter = (init: RouterInit) => {
  const [routerState, dispatchToReducer] = useReducer(
    nativeRouterReducer,
    init,
    initRouterState,
  );
  const routerStateRef = useRef(routerState);

  const routeWillChangeListeners = useRef<RouteListener[]>([]).current;
  const routeDidChangeListeners = useRef<RouteListener[]>([]).current;
  const screenWillBePushedListeners = useRef<ScreenListener[]>([]).current;
  const screenWillBeRemovedListeners = useRef<ScreenListener[]>([]).current;
  const modalInterceptors = useRef<Array<() => Promise<void>>>([]).current;
  const modalCloseRequestListeners = useRef<ModalCloseRequestListener[]>(
    [],
  ).current;

  const dispatch = useCallback(
    (action: RouterAction) => {
      startTransition(() => {
        const currentRoute = getCurrentRouteFromState(routerStateRef.current);
        const nextState = nativeRouterReducer(routerStateRef.current, action);
        const nextRoute = getCurrentRouteFromState(nextState);
        if (nextRoute && !isEqual(routerStateRef.current, nextState)) {
          if (nextRoute.id !== currentRoute?.id && nextRoute) {
            dispatchToListeners(routeWillChangeListeners, nextRoute.state);
          }
          const previousRoutes = getAllRoutesFromStack(
            routerStateRef.current.stack,
          );
          const nextRoutes = getAllRoutesFromStack(nextState.stack);
          const screenRemoved = previousRoutes.filter(
            route => !nextRoutes.find(nextRoute => nextRoute.id === route.id),
          );
          dispatchToListeners(
            screenWillBeRemovedListeners,
            screenRemoved.map(({ id, state: route }) => ({ id, route })),
          );
          const newRoutes = nextRoutes.filter(
            route =>
              !previousRoutes.find(prevRoute => prevRoute.id === route.id),
          );
          dispatchToListeners(
            screenWillBePushedListeners,
            newRoutes.map(({ id, state: route }) => ({ id, route })),
          );

          routerStateRef.current = nextState;
          dispatchToReducer(action);
        }
      });
    },
    [
      routeWillChangeListeners,
      screenWillBePushedListeners,
      screenWillBeRemovedListeners,
    ],
  );

  const currentRoute = getCurrentRouteFromState(routerState);

  useEffect(() => {
    // TODO should we dispatch after transition end ?
    const route = currentRoute?.state;
    if (route) {
      dispatchToListeners(routeDidChangeListeners, route);
    }
  }, [currentRoute, routeDidChangeListeners]);

  const replaceAll = useCallback(
    (init: RouterInit) => {
      dispatch({ type: 'REPLACE_ALL', payload: initRouterState(init) });
    },
    [dispatch],
  );

  useEffect(() => {
    replaceAll(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init.id]);

  const router = useMemo<NativeRouter>(() => {
    function addListener<T>(listeners: T[], listener: T) {
      const index = listeners.indexOf(listener);
      if (index === -1) {
        listeners.push(listener);
      }
      return {
        dispose() {
          const index = listeners.indexOf(listener);
          if (index === -1) {
            listeners.slice(index);
          }
        },
      };
    }

    // TODO doesn't works with stack in tabs
    const setTabIfExists = (route: Route) => {
      const tabState = getActiveTabs(routerStateRef.current);
      if (!tabState) {
        return false;
      }
      const { tabs } = tabState;
      const tabIndex = tabs.findIndex(
        tab => tab.kind === 'route' && tab.state.route === route.route,
      );
      if (tabIndex === -1) {
        return false;
      }
      dispatch({
        type: 'SET_TAB',
        payload: { tabIndex },
      });
      return true;
    };

    const splice = (route: Route | null, count: number) => {
      dispatch({
        type: 'SPLICE',
        payload: {
          route: route
            ? {
                id: (route as any)?.id ?? createId(),
                kind: 'route',
                state: pick(route, 'route', 'params') as Route,
              }
            : null,
          count,
        },
      });
    };

    // TODO we could add the possibilities to PUSH/REPLACE stack in tabs
    // if we feel the needs, but there is complex case to think about
    // so until we needs it we won't implement that
    return {
      getCurrentRoute() {
        return getCurrentRouteFromState(routerStateRef.current)?.state ?? null;
      },
      getCurrentRouterState() {
        return routerStateRef.current;
      },
      getCurrentScreenId() {
        return getCurrentRouteFromState(routerStateRef.current)?.id ?? null;
      },
      canGoBack() {
        return (
          routerStateRef.current.stack.length > 1 ||
          !!routerStateRef.current.modals.length
        );
      },
      push(route, allowDuplicate = false) {
        if (setTabIfExists(route)) {
          return;
        }
        if (!allowDuplicate) {
          const currentRoute = getCurrentRouteFromState(routerStateRef.current);
          if (currentRoute && isRouteEqual(currentRoute?.state, route)) {
            return;
          }
        }
        splice(route, 0);
      },
      back() {
        const activeTabs = getActiveTabs(routerStateRef.current);
        if (activeTabs) {
          const currentTab = activeTabs.tabs[activeTabs.currentIndex];
          if (currentTab.kind === 'stack' && currentTab.state.length > 1) {
            splice(null, 1);
            return true;
          } else if (activeTabs.tabsHistory.length > 0) {
            dispatch({ type: 'TAB_BACK' });
            return true;
          }
        } else if (routerStateRef.current.stack.length > 1) {
          splice(null, 1);
          return true;
        }
        return false;
      },
      pop(num) {
        splice(null, num);
      },
      replace(route) {
        if (setTabIfExists(route)) {
          return;
        }
        splice(route, 1);
      },
      splice,
      replaceAll,
      backToTop() {
        dispatch({ type: 'BACK_TO_TOP' });
      },

      showModal(descriptor, initialContent) {
        return Promise.all(
          modalInterceptors.map(interceptor => interceptor()),
        ).then(() => {
          dispatch({
            type: 'SHOW_MODAL',
            payload: { descriptor, initialContent },
          });
        });
      },
      updateModal(modalId, update) {
        dispatch({
          type: 'UPDATE_MODAL',
          payload: { modalId, ...update },
        });
      },
      hideModal(modalId) {
        dispatch({
          type: 'HIDE_MODAL',
          payload: { modalId },
        });
      },
      addModalInterceptor(callback) {
        modalInterceptors.push(callback);
        return () => {
          const index = modalInterceptors.indexOf(callback);
          if (index !== -1) {
            modalInterceptors.slice(index);
          }
        };
      },
      addRouteWillChangeListener: listener =>
        addListener(routeWillChangeListeners, listener),
      addRouteDidChangeListener: listener =>
        addListener(routeDidChangeListeners, listener),
      addScreenWillBePushedListener: listener =>
        addListener(screenWillBePushedListeners, listener),
      addScreenWillBeRemovedListener: listener =>
        addListener(screenWillBeRemovedListeners, listener),
      addModalCloseRequestListener: listener =>
        addListener(modalCloseRequestListeners, listener),

      __screenDismissed(id) {
        const { modals } = routerStateRef.current;
        const modal = modals.find(modal => modal.id === id);
        if (
          modal &&
          modalCloseRequestListeners.some(listener => listener(id))
        ) {
          return;
        }
        dispatch({
          type: 'SCREEN_DISMISSED',
          payload: { id },
        });
      },
    };
  }, [
    dispatch,
    modalInterceptors,
    modalCloseRequestListeners,
    replaceAll,
    routeDidChangeListeners,
    routeWillChangeListeners,
    screenWillBePushedListeners,
    screenWillBeRemovedListeners,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        const modalId = routerStateRef.current.modals.at(-1)?.id;
        if (modalId) {
          router.__screenDismissed(modalId);
          return true;
        }
        return router.back();
      },
    );

    return () => subscription.remove();
  }, [modalCloseRequestListeners, router]);

  return { router, routerState };
};

const initToRouteInstance = <T extends RouteInit | StackInit | TabsInit>(
  init: T,
): T extends StackInit
  ? StackRoute
  : T extends TabsInit
    ? TabsRoute
    : BasicRoute => {
  if ('stack' in init) {
    return {
      id: createId(),
      kind: 'stack',
      state: init.stack.map(initToRouteInstance),
    } as StackRoute as any;
  } else if ('tabs' in init) {
    const { id, currentIndex, tabs, lazy, unmountInactive } = init;
    return {
      id,
      kind: 'tabs',
      state: {
        currentIndex,
        tabs: tabs.map(initToRouteInstance),
        lazy: lazy ?? true,
        unmountInactive: unmountInactive ?? false,
        tabsHistory: [],
        screenOptions: init.screenOptions,
      },
    } as any;
  } else {
    const { id, ...route } = init;
    return { id, kind: 'route', state: route } as any;
  }
};

export const initRouterState = (init: RouterInit): RouterState => {
  const stack = initToRouteInstance({ stack: init.stack }).state;
  return {
    stack,
    modals: [],
  };
};
