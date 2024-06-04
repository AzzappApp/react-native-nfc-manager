import { EventEmitter } from 'events';
import { isEqual, pick } from 'lodash';
import React, {
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
  useContext,
  createContext,
} from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, ScreenContainer, ScreenStack } from 'react-native-screens';
import { createDeferred } from '@azzapp/shared/asyncHelpers';
import { isRouteEqual, type Route, type ROUTES } from '#routes';
import { createId } from '#helpers/idHelpers';
import useLatestCallback from '#hooks/useLatestCallback';
import type { ComponentType, ReactNode, Provider, Ref } from 'react';
import type { NativeSyntheticEvent, TargetedEvent } from 'react-native';
import type { ScreenProps } from 'react-native-screens';

// TODO some use case of TABS usage and screen listener might be wrong

type StackRoute = { id: string; kind: 'stack'; state: StackState };
type TabsRoute = { id: string; kind: 'tabs'; state: TabsState };
type BasicRoute = { id: string; kind: 'route'; state: Route };

type RouteInstance = BasicRoute | StackRoute | TabsRoute;

type ModalDescriptor = {
  id: string;
  ownerId: string;
  animationType: 'fade' | 'none' | 'slide';
  onWillAppear?: () => void;
  onDisappear?: () => void;
};

type PushAction = {
  type: 'PUSH';
  payload: Exclude<RouteInstance, StackRoute>;
};

type ReplaceAction = {
  type: 'REPLACE';
  payload: Exclude<RouteInstance, StackRoute>;
};

type ShowModalAction = {
  type: 'SHOW_MODAL';
  payload: {
    descriptor: Omit<ModalDescriptor, 'ownerId'>;
    initialContent: ReactNode;
  };
};

type HideModalAction = {
  type: 'HIDE_MODAL';
  payload: { modalId: string };
};

type SetModalContentAction = {
  type: 'SET_MODAL_CONTENT';
  payload: { modalId: string; content: ReactNode };
};

type PopAction = {
  type: 'POP';
  payload: {
    count: number;
  };
};

type BackToTopAction = {
  type: 'BACK_TO_TOP';
  payload?: undefined;
};

type ScreenDismissedAction = {
  type: 'SCREEN_DISMISSED';
  payload: { id: string };
};

type SetTabAction = {
  type: 'SET_TAB';
  payload: { tabIndex: number };
};

type ReplaceAllAction = {
  type: 'REPLACE_ALL';
  payload: RouterState;
};

type RouterAction =
  | BackToTopAction
  | HideModalAction
  | PopAction
  | PushAction
  | ReplaceAction
  | ReplaceAllAction
  | ScreenDismissedAction
  | SetModalContentAction
  | SetTabAction
  | ShowModalAction;

type StackState = Array<Exclude<RouteInstance, StackRoute>>;

type TabsState = {
  tabs: Array<Exclude<RouteInstance, TabsRoute>>;
  currentIndex: number;
};

export type RouterState = {
  stack: StackState;
  modals: Array<ModalDescriptor & { children: ReactNode }>;
};

const stackReducer = (
  stack: StackState,
  { type, payload }: RouterAction,
): StackState => {
  switch (type) {
    case 'PUSH':
      return [...stack, payload];
    case 'POP':
      return payload.count === 0
        ? stack
        : stack.slice(0, stack.length - payload.count);
    case 'REPLACE':
      return [...stack.slice(0, stack.length - 1), payload];
    case 'SCREEN_DISMISSED':
      return stack.filter(routeInfo => routeInfo.id !== payload.id);
    default:
      return stack;
  }
};

const tabsReducer = (
  state: TabsState,
  { type, payload }: RouterAction,
): TabsState => {
  switch (type) {
    case 'SET_TAB':
      return { tabs: state.tabs, currentIndex: payload.tabIndex };
    default:
      return state;
  }
};

const applyActionToDeepestStack = (
  stack: StackState,
  action: RouterAction,
): StackState => {
  const lastScreen = stack[stack.length - 1];
  if (lastScreen.kind === 'tabs') {
    const { tabs, currentIndex } = lastScreen.state;
    const tabScreen = tabs[currentIndex];
    const isBackAction =
      action.type === 'POP' || action.type === 'SCREEN_DISMISSED';
    const count = action.type === 'POP' ? action.payload.count : 1;
    if (
      tabScreen.kind === 'stack' &&
      (!isBackAction || tabScreen.state.length >= count + 1)
    ) {
      return [
        ...stack.slice(0, stack.length - count),
        {
          ...lastScreen,
          state: {
            currentIndex,
            tabs: Object.assign([...tabs], {
              [currentIndex]: {
                id: tabScreen.id,
                kind: 'stack',
                state: applyActionToDeepestStack(tabScreen.state, action),
              },
            }),
          },
        },
      ];
    }
  }
  return stackReducer(stack, action);
};

const applyActionToDeepestTabs = (
  state: TabsState,
  action: RouterAction,
): TabsState => {
  const currentScreen = state.tabs[state.currentIndex];
  if (currentScreen.kind === 'stack') {
    const { state: stack } = currentScreen;
    const lastScreen = stack[stack.length - 1];
    if (lastScreen.kind === 'tabs') {
      const { currentIndex, tabs } = state;
      return {
        currentIndex,
        tabs: Object.assign([...tabs], {
          [currentIndex]: {
            ...currentScreen,
            state: [
              ...stack.slice(0, stack.length - 1),
              {
                ...lastScreen,
                state: applyActionToDeepestTabs(lastScreen.state, action),
              },
            ],
          },
        }),
      };
    }
  }
  return tabsReducer(state, action);
};

const routerReducer = (
  state: RouterState,
  action: RouterAction,
): RouterState => {
  switch (action.type) {
    case 'PUSH':
      return {
        ...state,
        stack: applyActionToDeepestStack(state.stack, action),
      };
    case 'REPLACE': {
      return {
        ...state,
        stack: applyActionToDeepestStack(state.stack, action),
      };
    }
    case 'POP':
    case 'SCREEN_DISMISSED': {
      return {
        ...state,
        stack: applyActionToDeepestStack(state.stack, action),
      };
    }
    case 'SET_TAB': {
      let stack = state.stack;
      let lastScreen = stack[stack.length - 1];
      if (lastScreen.kind === 'tabs') {
        lastScreen = {
          ...lastScreen,
          state: applyActionToDeepestTabs(lastScreen.state, action),
        };
        stack = [...stack.slice(0, stack.length - 1), lastScreen];

        return { ...state, stack };
      }
      return state;
    }
    case 'BACK_TO_TOP': {
      const firstRoute = state.stack[0];
      return {
        stack: [
          firstRoute.kind === 'tabs'
            ? { ...firstRoute, state: { ...firstRoute.state, currentIndex: 0 } }
            : firstRoute,
        ],
        modals: [],
      };
    }
    case 'REPLACE_ALL':
      return action.payload;
    default:
      return state;
  }
};

const routerReducerWithModal = (
  state: RouterState,
  action: RouterAction,
): RouterState => {
  state = routerReducer(state, action);
  const currentRoute = getCurrentRouteFromState(state);
  if (!currentRoute) {
    return state;
  }
  if (state.modals.some(modal => modal.ownerId !== currentRoute.id)) {
    state = {
      ...state,
      modals: state.modals.filter(modal => modal.ownerId === currentRoute.id),
    };
  }

  switch (action.type) {
    case 'SHOW_MODAL': {
      const index = state.modals.findIndex(
        modal => modal.id === action.payload.descriptor.id,
      );
      const modal = {
        ...action.payload.descriptor,
        children: action.payload.initialContent,
        ownerId: currentRoute.id,
      };
      if (index !== -1) {
        return {
          stack: state.stack,
          modals: [
            ...state.modals.slice(0, index),
            modal,
            ...state.modals.slice(index + 1),
          ],
        };
      }
      return {
        stack: state.stack,
        modals: [...state.modals, modal],
      };
    }
    case 'SET_MODAL_CONTENT': {
      const index = state.modals.findIndex(
        modal => modal.id === action.payload.modalId,
      );
      if (index === -1) {
        return state;
      }
      const modal = state.modals[index];
      return {
        stack: state.stack,
        modals: [
          ...state.modals.slice(0, index),
          { ...modal, children: action.payload.content },
          ...state.modals.slice(index + 1),
        ],
      };
    }
    case 'HIDE_MODAL':
      return {
        stack: state.stack,
        modals: state.modals.filter(
          modal => modal.id !== action.payload.modalId,
        ),
      };
    default:
      return state;
  }
};

type ScreenListener = (args: { id: string; route: Route }) => void;

export type RouteListener = (route: Route) => void;

export type NativeRouter = {
  push<T extends Route>(route: T): void;
  replace(route: Route): void;
  back(): void;
  canGoBack(): boolean;
  pop(num: number): void;
  showModal(
    route: Omit<ModalDescriptor, 'ownerId'>,
    initialContent: ReactNode,
  ): void;
  setModalContent(id: string, content: ReactNode): void;
  hideModal(id: string): void;
  getCurrentRoute(): Route | null;
  getCurrentScreenId(): string | null;
  addModalInterceptor(callback: () => Promise<void>): () => void;
  addRouteWillChangeListener: (listener: RouteListener) => {
    dispose(): void;
  };
  addRouteDidChangeListener: (listener: RouteListener) => {
    dispose(): void;
  };
  replaceAll(routes: NativeRouterInit): void;
  backToTop(): void;
  screenDismissed(id: string): void;
  addScreenWillBePushedListener: (listener: ScreenListener) => {
    dispose: () => void;
  };
  addScreenWillBeRemovedListener: (listener: ScreenListener) => {
    dispose: () => void;
  };
};

type RouteInit = Route & { id: string };

type TabsInit = {
  id: string;
  tabs: Array<RouteInit | StackInit>;
  currentIndex: number;
};

type StackInit = { stack: Array<RouteInit | TabsInit> };

export type NativeRouterInit = {
  id: string;
  stack: Array<RouteInit | TabsInit>;
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
    const { id, currentIndex, tabs } = init;
    return {
      id,
      kind: 'tabs',
      state: {
        currentIndex,
        tabs: tabs.map(initToRouteInstance),
      },
    } as any;
  } else {
    const { id, ...route } = init;
    return { id, kind: 'route', state: route } as any;
  }
};

export const initRouterState = (init: NativeRouterInit): RouterState => {
  const stack = initToRouteInstance({ stack: init.stack }).state;
  //not propaging id to the routerState (not needed for now)
  return {
    stack,
    modals: [],
  };
};

export const useNativeRouter = (init: NativeRouterInit) => {
  // We can't use useReducer since we need to dispatch event before
  // the state change takes effect
  const [routerState, setRouterState] = useState<RouterState>(
    initRouterState(init),
  );
  const routerStateRef = useRef(routerState);

  const routeWillChangeListeners = useRef<RouteListener[]>([]).current;
  const routeDidChangeListeners = useRef<RouteListener[]>([]).current;
  const screenWillBePushedListeners = useRef<ScreenListener[]>([]).current;
  const screenWillBeRemovedListeners = useRef<ScreenListener[]>([]).current;
  const modalInterceptors = useRef<Array<() => Promise<void>>>([]).current;

  const dispatch = useCallback((action: RouterAction) => {
    const state = routerStateRef.current;
    const currentRoute = getCurrentRouteFromState(state);
    const newState = routerReducerWithModal(state, action);
    const nextRoute = getCurrentRouteFromState(newState);

    if (!isEqual(state, newState)) {
      if (nextRoute?.id !== currentRoute?.id && nextRoute) {
        dispatchToListeners(routeWillChangeListeners, nextRoute.state);
      }

      routerStateRef.current = newState;
      setRouterState(newState);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRoute = getCurrentRouteFromState(routerState);

  useEffect(() => {
    // TODO should we dispatch after transition end ?
    const route = currentRoute?.state;
    if (route) {
      dispatchToListeners(routeDidChangeListeners, route);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute]);

  const replaceAll = useCallback(
    (init: NativeRouterInit) => {
      const { stack } = routerStateRef.current;

      const routesInInit = getAllRoutesFromInit(init);

      const screenRemoved = getAllRoutesFromStack(stack).filter(
        route => !routesInInit.find(initRoute => initRoute === route.id),
      );

      screenRemoved.forEach(({ id, state: route }) =>
        dispatchToListeners(screenWillBeRemovedListeners, { id, route }),
      );
      const nextState = initRouterState(init);
      const screenPusheds = getAllRoutesFromStack(nextState.stack, [], true);
      screenPusheds.forEach(({ id, state: route }) =>
        dispatchToListeners(screenWillBePushedListeners, { id, route }),
      );

      dispatch({ type: 'REPLACE_ALL', payload: nextState });
    },
    [dispatch, screenWillBePushedListeners, screenWillBeRemovedListeners],
  );

  useEffect(() => {
    replaceAll(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init.id]);

  const router = useMemo<NativeRouter>(() => {
    const getCurrentRoute = () =>
      getCurrentRouteFromState(routerStateRef.current);
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
      // TODO this is actually incorect in case of stack inside tabs
      dispatchToListeners(screenWillBePushedListeners, {
        id: tabs[tabIndex].id,
        route,
      });
      dispatch({
        type: 'SET_TAB',
        payload: { tabIndex },
      });
      return true;
    };

    // TODO we could add the possibilities to PUSH/REPLACE stack in tabs
    // if we feel the needs, but there is complex case to think about
    // so until we needs it we won't implement that
    return {
      getCurrentRoute() {
        return getCurrentRouteFromState(routerStateRef.current)?.state ?? null;
      },
      getCurrentScreenId() {
        return getCurrentRouteFromState(routerStateRef.current)?.id ?? null;
      },
      push(route: Route) {
        const currentRoute =
          getCurrentRouteFromState(routerStateRef.current)?.state ?? null;
        if (currentRoute && isRouteEqual(route, currentRoute)) {
          return;
        }
        if (setTabIfExists(route)) {
          return;
        }

        const id: string = (route as any).id ?? createId();
        // avoid extraneous propery (like id) that might cause bug
        route = pick(route, 'route', 'params') as Route;

        dispatchToListeners(screenWillBePushedListeners, { id, route });
        dispatch({
          type: 'PUSH',
          payload: { state: route, kind: 'route', id },
        });
      },
      replace(route: Route) {
        if (setTabIfExists(route)) {
          return;
        }
        const id: string = (route as any).id ?? createId();
        route = pick(route, 'route', 'params') as Route;

        const currentRoute = getCurrentRoute();
        if (currentRoute) {
          // TODO incorrect if replaced screen is a tab
          dispatchToListeners(screenWillBeRemovedListeners, {
            id: currentRoute.id,
            route: currentRoute.state,
          });
        }
        dispatchToListeners(screenWillBePushedListeners, { id, route });
        dispatch({
          type: 'REPLACE',
          payload: { id, kind: 'route', state: route },
        });
      },
      addModalInterceptor(callback: () => Promise<void>) {
        modalInterceptors.push(callback);
        return () => {
          const index = modalInterceptors.indexOf(callback);
          if (index !== -1) {
            modalInterceptors.slice(index);
          }
        };
      },
      showModal(descriptor: Omit<ModalDescriptor, 'ownerId'>, initialContent) {
        Promise.all(modalInterceptors.map(interceptor => interceptor())).then(
          () => {
            dispatch({
              type: 'SHOW_MODAL',
              payload: { descriptor, initialContent },
            });
          },
        );
      },
      setModalContent(modalId: string, content: ReactNode) {
        dispatch({
          type: 'SET_MODAL_CONTENT',
          payload: { modalId, content },
        });
      },
      hideModal(modalId: string) {
        const modal = routerStateRef.current.modals.find(
          modal => modal.id === modalId,
        );

        dispatch({
          type: 'HIDE_MODAL',
          payload: { modalId },
        });

        modal?.onDisappear?.();
      },
      back() {
        const currentRoute = getCurrentRoute();
        // TODO incorrect if replaced screen is a tab
        if (currentRoute) {
          dispatchToListeners(screenWillBeRemovedListeners, {
            id: currentRoute.id,
            route: currentRoute.state,
          });
        }
        dispatch({
          type: 'POP',
          payload: {
            count: 1,
          },
        });
      },
      canGoBack() {
        const { stack, modals } = routerStateRef.current;
        return stack.length > 1 || modals.length > 0;
      },
      pop(num: number) {
        const { stack } = routerStateRef.current;
        const screenRemoved = getAllRoutesFromStack(stack).slice(0, num);

        screenRemoved.forEach(({ id, state: route }) =>
          dispatchToListeners(screenWillBeRemovedListeners, { id, route }),
        );
        dispatch({
          type: 'POP',
          payload: {
            count: num,
          },
        });
      },
      // Native Router specific methods
      replaceAll,
      backToTop() {
        const { stack } = routerStateRef.current;
        const screenRemoved = getAllRoutesFromStack(stack.slice(1));
        screenRemoved.forEach(({ id, state: route }) =>
          dispatchToListeners(screenWillBeRemovedListeners, { id, route }),
        );
        dispatch({
          type: 'BACK_TO_TOP',
        });
      },
      screenDismissed(id) {
        dispatch({
          type: 'SCREEN_DISMISSED',
          payload: { id },
        });
      },
      addRouteWillChangeListener: listener =>
        addListener(routeWillChangeListeners, listener),
      addRouteDidChangeListener: listener =>
        addListener(routeDidChangeListeners, listener),
      addScreenWillBePushedListener: listener =>
        addListener(screenWillBePushedListeners, listener),
      addScreenWillBeRemovedListener: listener =>
        addListener(screenWillBeRemovedListeners, listener),
    };
  }, [
    dispatch,
    modalInterceptors,
    replaceAll,
    routeDidChangeListeners,
    routeWillChangeListeners,
    screenWillBePushedListeners,
    screenWillBeRemovedListeners,
  ]);

  return { router, routerState };
};

export type ScreenOptions = Omit<
  ScreenProps,
  | 'active'
  | 'activityState'
  | 'children'
  | 'onAppear'
  | 'onDisappear'
  | 'onDismissed'
  | 'onHeaderBackButtonClicked'
  | 'onTransitionProgress'
  | 'onTransitionProgress'
  | 'onWillAppear'
  | 'onWillDisappear'
> & { ref?: Ref<Screen> };

export type NativeScreenProps<T extends Route> = {
  screenId: string;
  hasFocus: boolean;
  route: T;
};

export type ScreenMap = Record<ROUTES, ComponentType<NativeScreenProps<any>>>;
export type TabsMap = Partial<
  Record<string, ComponentType<TabsState & { id: string }>>
>;

type ScreensRendererProps = {
  routerState: RouterState;
  screens: ScreenMap;
  tabs?: TabsMap;
  defaultScreenOptions?: ScreenOptions | null;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
  onScreenDismissed?: (id: string) => void;
};

const RouterContext = createContext<NativeRouter | null>(null);

export const RouterProvider = RouterContext.Provider as Provider<NativeRouter>;

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

export const ScreensRenderer = ({
  routerState,
  screens,
  tabs = {},
  defaultScreenOptions,
  onFinishTransitioning,
  onScreenDismissed,
}: ScreensRendererProps) => {
  const { stack, modals } = routerState;

  return (
    <>
      <StackRenderer
        stack={stack}
        screens={screens}
        tabsRenderers={tabs}
        defaultScreenOptions={defaultScreenOptions}
        onFinishTransitioning={onFinishTransitioning}
        onScreenDismissed={onScreenDismissed}
        hasFocus={modals.length === 0}
      >
        {modals.map(
          ({ id, children, animationType, onWillAppear, onDisappear }) => (
            <Screen
              key={id}
              activityState={2}
              isNativeStack
              onWillAppear={onWillAppear}
              onDisappear={onDisappear}
              // do we really need to prevent gesture ?
              gestureEnabled={false}
              stackAnimation={
                animationType === 'fade'
                  ? 'fade'
                  : animationType === 'none'
                    ? 'none'
                    : 'slide_from_bottom'
              }
            >
              <GestureHandlerRootView style={{ flex: 1 }}>
                {children}
              </GestureHandlerRootView>
            </Screen>
          ),
        )}
      </StackRenderer>
    </>
  );
};

export const useNativeNavigationEvent = (
  event: NativeNavigationEvent,
  handler: () => void,
) => {
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

export const ScreenDidAppear = ({ children }: { children: ReactNode }) => {
  const deferred = useMemo(() => createDeferred<boolean>(), []);
  const { didAppear } = useContext(ScreenRendererContext);

  useEffect(() => {
    if (didAppear) {
      deferred.resolve(true);
    }
  }, [didAppear, deferred]);

  return (
    <ScreenDidAppearInner
      screenDidAppear={didAppear}
      promise={deferred.promise}
    >
      {children}
    </ScreenDidAppearInner>
  );
};

const ScreenDidAppearInner = ({
  screenDidAppear,
  promise,
  children,
}: {
  screenDidAppear: boolean;
  promise: Promise<boolean>;
  children: ReactNode;
}) => {
  if (!screenDidAppear) {
    throw promise;
  }
  return <>{children}</>;
};

const StackRenderer = ({
  stack,
  screens,
  tabsRenderers,
  defaultScreenOptions,
  hasFocus,
  children,
  onScreenDismissed,
  onFinishTransitioning,
}: {
  stack: StackState;
  screens: ScreenMap;
  tabsRenderers: TabsMap;
  defaultScreenOptions?: ScreenOptions | null;
  hasFocus?: boolean;
  children?: ReactNode;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
  onScreenDismissed?: (id: string) => void;
}) => {
  const childs: any[] = useMemo(
    () =>
      stack.map((routeInfo, index) => {
        const screenHasFocus = hasFocus && index === stack.length - 1;
        if (routeInfo.kind === 'tabs') {
          return (
            <Screen
              key={routeInfo.id}
              enabled
              isNativeStack
              style={StyleSheet.absoluteFill}
            >
              <TabsRenderer
                id={routeInfo.id}
                tabState={routeInfo.state}
                screens={screens}
                tabsRenderers={tabsRenderers}
                defaultScreenOptions={defaultScreenOptions}
                onFinishTransitioning={onFinishTransitioning}
                onScreenDismissed={onScreenDismissed}
                hasFocus={screenHasFocus}
              />
            </Screen>
          );
        }

        return (
          <ScreenRenderer
            key={routeInfo.id}
            id={routeInfo.id}
            {...routeInfo.state}
            defaultScreenOptions={defaultScreenOptions}
            screens={screens}
            onDismissed={() => onScreenDismissed?.(routeInfo.id)}
            hasFocus={screenHasFocus}
            isNativeStack
          />
        );
      }),
    [
      defaultScreenOptions,
      hasFocus,
      onFinishTransitioning,
      onScreenDismissed,
      screens,
      stack,
      tabsRenderers,
    ],
  );

  return (
    <ScreenStack
      style={{ flex: 1 }}
      onFinishTransitioning={onFinishTransitioning}
    >
      {childs}
      {children}
    </ScreenStack>
  );
};

const TabsRenderer = ({
  id,
  tabState: { tabs, currentIndex },
  tabsRenderers,
  screens,
  defaultScreenOptions,
  hasFocus,
  onScreenDismissed,
  onFinishTransitioning,
}: {
  id: string;
  tabState: TabsState;
  tabsRenderers: TabsMap;
  screens: ScreenMap;
  defaultScreenOptions?: ScreenOptions | null;
  hasFocus?: boolean;
  onScreenDismissed?: (id: string) => void;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
}) => {
  const TabsListRenderer = tabsRenderers[id];
  const visitedTabs = useRef(new Set<string>()).current;
  visitedTabs.add(tabs[currentIndex].id);

  return (
    <>
      <ScreenContainer style={{ flex: 1 }} hasTwoStates>
        {tabs.map((routeInfo, index) => {
          const screenHasFocus = hasFocus && index === currentIndex;
          if (!visitedTabs.has(routeInfo.id)) {
            return null;
          }

          const isActive = currentIndex === index;
          if (routeInfo.kind === 'stack') {
            return (
              <Screen
                key={routeInfo.id}
                activityState={isActive ? 2 : 0}
                enabled
                style={StyleSheet.absoluteFill}
              >
                <StackRenderer
                  stack={routeInfo.state}
                  screens={screens}
                  tabsRenderers={tabsRenderers}
                  defaultScreenOptions={defaultScreenOptions}
                  onFinishTransitioning={onFinishTransitioning}
                  // we don't dispatch onDismissed for tab switch
                  onScreenDismissed={isActive ? onScreenDismissed : undefined}
                  hasFocus={screenHasFocus}
                />
              </Screen>
            );
          }

          return (
            <ScreenRenderer
              {...routeInfo.state}
              key={routeInfo.id}
              id={routeInfo.id}
              activityState={currentIndex === index ? 2 : 0}
              defaultScreenOptions={defaultScreenOptions}
              screens={screens}
              isNativeStack={false}
              hasFocus={screenHasFocus}
            />
          );
        })}
      </ScreenContainer>
      {TabsListRenderer && (
        <TabsListRenderer id={id} tabs={tabs} currentIndex={currentIndex} />
      )}
    </>
  );
};

type NativeNavigationEvent =
  | 'appear'
  | 'disappear'
  | 'dismissed'
  | 'willAppear'
  | 'willDisappear';

export const ScreenRendererContext = React.createContext<{
  id: string;
  navigationEventEmitter: EventEmitter;
  hasFocus?: boolean;
  didAppear: boolean;
  setOptions: (
    value:
      | ScreenOptions
      | ((value: ScreenOptions | null) => ScreenOptions | null)
      | null,
  ) => void;
}>({
  id: '',
  navigationEventEmitter: new EventEmitter(),
  didAppear: false,
  setOptions: () => void 0,
});

type ScreenRendererProps = Route & {
  id: string;
  screens: ScreenMap;
  activityState?: 0 | 1 | 2;
  isNativeStack?: boolean;
  defaultScreenOptions?: ScreenOptions | null;
  hasFocus?: boolean;
  onDismissed?: () => void;
};

const ScreenRenderer = ({
  id,
  route,
  params,
  screens,
  activityState,
  defaultScreenOptions,
  hasFocus,
  isNativeStack,
  onDismissed: onDismissedProp,
}: ScreenRendererProps) => {
  const Component: any = screens[route];

  const navigationEventEmitter = useRef(new EventEmitter()).current;
  const safeArea = useSafeAreaInsets();

  useEffect(
    () => () => {
      navigationEventEmitter.removeAllListeners();
    },
    [navigationEventEmitter],
  );

  const [options, setOptions] = useState(() => {
    let options: ScreenOptions | null = defaultScreenOptions ?? null;
    if (typeof Component.options === 'object') {
      options = { ...options, ...Component.options };
    }
    if (typeof Component.getScreenOptions === 'function') {
      options = { ...options, ...Component.getScreenOptions(params, safeArea) };
    }
    return options;
  });

  const [didAppear, setDidAppear] = useState(false);
  const screenContextValue = useMemo(
    () => ({
      id,
      navigationEventEmitter,
      hasFocus,
      didAppear,
      setOptions,
    }),
    [id, navigationEventEmitter, didAppear, hasFocus],
  );

  const onAppear = () => {
    navigationEventEmitter.emit('appear');
    setDidAppear(true);
  };

  const onDismissed = () => {
    // TODO this event might be dispatched on tab switch which has no sense
    navigationEventEmitter.emit('dismissed');
    onDismissedProp?.();
  };

  const screenView = useMemo(
    () =>
      Component ? (
        <Component
          screenId={id}
          hasFocus={hasFocus}
          route={{ route, params }}
        />
      ) : null,
    [Component, id, hasFocus, route, params],
  );

  if (!Component) {
    console.error(`Unknown component for route ${route}`);
    return null;
  }

  return (
    <Screen
      {...options}
      key={id}
      activityState={activityState}
      isNativeStack={isNativeStack}
      onAppear={onAppear}
      onWillAppear={() => navigationEventEmitter.emit('willAppear')}
      onDisappear={() => navigationEventEmitter.emit('disappear')}
      onWillDisappear={() => navigationEventEmitter.emit('willDisappear')}
      onDismissed={onDismissed}
      style={StyleSheet.absoluteFill}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ScreenRendererContext.Provider value={screenContextValue}>
          {screenView}
        </ScreenRendererContext.Provider>
      </GestureHandlerRootView>
    </Screen>
  );
};

const getCurrentRouteFromState = ({
  stack,
}: RouterState): BasicRoute | null => {
  let currentRoute: RouteInstance | null = stack[stack.length - 1];
  while (currentRoute?.kind !== 'route') {
    if (!currentRoute) {
      return null;
    }
    if (currentRoute.kind === 'tabs') {
      currentRoute = currentRoute.state.tabs[currentRoute.state.currentIndex];
    }
    if (currentRoute.kind === 'stack') {
      currentRoute = currentRoute.state[currentRoute.state.length - 1];
    }
  }
  return currentRoute;
};

const getAllRoutesFromStack = (
  state: StackState,
  routes: BasicRoute[] = [],
  excludeNonActiveTabs = false,
) => {
  for (let i = state.length - 1; i >= 0; i--) {
    const screen = state[i];
    if (screen.kind === 'route') {
      routes.push(screen);
    } else if (screen.kind === 'tabs') {
      const tabs = excludeNonActiveTabs
        ? [screen.state.tabs[screen.state.currentIndex]]
        : screen.state.tabs;
      tabs.forEach(screen => {
        if (screen.kind === 'route') {
          routes.push(screen);
        } else {
          getAllRoutesFromStack(screen.state, routes);
        }
      });
    }
  }
  return routes;
};

const getAllRoutesFromInit = (init: NativeRouterInit) => {
  const routes: string[] = [];

  init.stack.forEach(stack => {
    if ('tabs' in stack) {
      stack.tabs.forEach(tab => {
        if ('id' in tab) {
          routes.push(tab.id);
        }
      });
    } else {
      routes.push(stack.id);
    }
  });

  return routes;
};

const getActiveTabs = ({ stack }: RouterState): TabsState | null => {
  let currentRoute: RouteInstance = stack[stack.length - 1];
  let currentTabs: TabsState | null = null;
  while (currentRoute?.kind !== 'route') {
    if (!currentRoute) {
      return null;
    }
    if (currentRoute.kind === 'tabs') {
      currentTabs = currentRoute.state;
      currentRoute = currentRoute.state.tabs[currentRoute.state.currentIndex];
    }
    if (currentRoute.kind === 'stack') {
      currentRoute = currentRoute.state[currentRoute.state.length - 1];
    }
  }
  return currentTabs;
};

function dispatchToListeners<
  T extends (...args: any) => any,
  U extends Parameters<T>,
>(listeners: T[], ...args: U) {
  listeners.forEach(listener => listener(...(args as any)));
}
