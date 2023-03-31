import { EventEmitter } from 'events';
import React, {
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
  useContext,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, ScreenContainer, ScreenStack } from 'react-native-screens';
import { createId } from '#helpers/idHelpers';
import type {
  Router as PlatformRouter,
  RouteListener,
} from '#PlatformEnvironment';
import type { Route, ROUTES } from '#routes';
import type { ComponentType, ReactNode } from 'react';
import type { NativeSyntheticEvent, TargetedEvent } from 'react-native';
import type { ScreenProps } from 'react-native-screens';

// TODO some use case of TABS usage and screen listener might be wrong

type StackRoute = { id: string; kind: 'stack'; state: StackState };
type TabsRoute = { id: string; kind: 'tabs'; state: TabsState };
type BasicRoute = { id: string; kind: 'route'; state: Route };

type RouteInstance = BasicRoute | StackRoute | TabsRoute;

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
  payload: Exclude<RouteInstance, StackRoute>;
};

type BackAction = {
  type: 'BACK';
  payload?: undefined;
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
  | BackAction
  | BackToTopAction
  | PushAction
  | ReplaceAction
  | ReplaceAllAction
  | ScreenDismissedAction
  | SetTabAction
  | ShowModalAction;

type StackState = Array<Exclude<RouteInstance, StackRoute>>;

type TabsState = {
  tabs: Array<Exclude<RouteInstance, TabsRoute>>;
  currentIndex: number;
};

export type RouterState = {
  stack: StackState;
  modals: StackState;
};

const stackReducer = (
  stack: StackState,
  { type, payload }: RouterAction,
): StackState => {
  switch (type) {
    case 'PUSH':
      return [...stack, payload];
    case 'BACK':
      return stack.slice(0, stack.length - 1);
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
      action.type === 'BACK' || action.type === 'SCREEN_DISMISSED';
    if (
      tabScreen.kind === 'stack' &&
      (!isBackAction || tabScreen.state.length >= 2)
    ) {
      return [
        ...stack.slice(0, stack.length - 1),
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
    case 'BACK':
    case 'REPLACE':
    case 'SCREEN_DISMISSED': {
      if (state.modals.length) {
        return {
          ...state,
          modals: applyActionToDeepestStack(state.modals, action),
        };
      }
      return {
        ...state,
        stack: applyActionToDeepestStack(state.stack, action),
      };
    }
    case 'SET_TAB': {
      let stack = state.modals.length ? state.modals : state.stack;
      let lastScreen = stack[stack.length - 1];
      if (lastScreen.kind === 'tabs') {
        lastScreen = {
          ...lastScreen,
          state: applyActionToDeepestTabs(lastScreen.state, action),
        };
        stack = [...stack.slice(0, stack.length - 1), lastScreen];

        return state.modals.length
          ? { ...state, modals: stack }
          : { ...state, stack };
      }
      return state;
    }
    case 'SHOW_MODAL':
      return {
        ...state,
        modals: [...state.modals, action.payload],
      };
    case 'BACK_TO_TOP':
      return {
        stack: [state.stack[0]],
        modals: [],
      };
    case 'REPLACE_ALL':
      return action.payload;
    default:
      console.error(`Unknonw route action of type '${(action as any).type}'`);
      return state;
  }
};

type ScreenListener = (args: { id: string; route: Route }) => void;

export type NativeRouter = PlatformRouter & {
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
  modals?: Array<RouteInit | TabsInit>;
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
  const modals = init.modals
    ? initToRouteInstance({ stack: init.modals }).state
    : [];
  //not propaging id to the routerState (not needed for now)
  return {
    stack,
    modals,
  };
};

export const useNativeRouter = (init: NativeRouterInit) => {
  // We can't use useReducer since we need to dispatch event before
  // the state change takes effect
  const [routerState, setRouterState] = useState<RouterState>(
    initRouterState(init),
  );

  const routerStateRef = useRef(routerState);
  // this is clearly not working properly when changing routerState. Other solution would be using immutable state for example
  if (routerStateRef.current !== routerState) {
    routerStateRef.current = routerState;
  }

  const routeWillChangeListeners = useRef<RouteListener[]>([]).current;
  const routeDidChangeListeners = useRef<RouteListener[]>([]).current;
  const screenWillBePushedListeners = useRef<ScreenListener[]>([]).current;
  const screenWillBeRemovedListeners = useRef<ScreenListener[]>([]).current;

  const dispatch = useCallback((action: RouterAction) => {
    const state = routerStateRef.current;
    const currentRoute = getCurrentRouteFromState(state);
    const newState = routerReducer(state, action);
    const nextRoute = getCurrentRouteFromState(newState);
    if (nextRoute !== currentRoute) {
      dispatchToListeners(routeWillChangeListeners, nextRoute.state);
    }
    setRouterState(newState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRoute = getCurrentRouteFromState(routerState);

  useEffect(() => {
    // TODO should we dispatch after transition end ?
    dispatchToListeners(routeDidChangeListeners, currentRoute.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute]);

  const replaceAll = useCallback(
    (init: NativeRouterInit) => {
      const { stack, modals } = routerStateRef.current;
      const screenRemoved = [
        ...getAllRoutesFromStack(modals),
        ...getAllRoutesFromStack(stack),
      ];
      screenRemoved.forEach(({ id, state: route }) =>
        dispatchToListeners(screenWillBeRemovedListeners, { id, route }),
      );
      const nextState = initRouterState(init);
      const screenPusheds = [
        ...getAllRoutesFromStack(nextState.modals, [], true),
        ...getAllRoutesFromStack(nextState.stack, [], true),
      ];
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
        return getCurrentRouteFromState(routerStateRef.current).state;
      },
      push(route: Route) {
        if (setTabIfExists(route)) {
          return;
        }
        const id = (route as any).id ?? createId();
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
        const id = (route as any).id ?? createId();
        const currentRoute = getCurrentRoute();
        // TODO incorrect if replaced screen is a tab
        dispatchToListeners(screenWillBeRemovedListeners, {
          id: currentRoute.id,
          route: currentRoute.state,
        });
        dispatchToListeners(screenWillBePushedListeners, { id, route });
        dispatch({
          type: 'REPLACE',
          payload: { id, kind: 'route', state: route },
        });
      },
      showModal(route: Route) {
        const id = (route as any).id ?? createId();
        dispatchToListeners(screenWillBePushedListeners, { id, route });
        dispatch({
          type: 'SHOW_MODAL',
          payload: { state: route, kind: 'route', id },
        });
      },
      back() {
        const currentRoute = getCurrentRoute();
        // TODO incorrect if replaced screen is a tab
        dispatchToListeners(screenWillBeRemovedListeners, {
          id: currentRoute.id,
          route: currentRoute.state,
        });
        dispatch({
          type: 'BACK',
        });
      },
      // Native Router specific methods
      replaceAll,
      backToTop() {
        const { stack, modals } = routerStateRef.current;
        const screenRemoved = [
          ...getAllRoutesFromStack(modals),
          ...getAllRoutesFromStack(stack),
        ];
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
>;

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
  defaultScreenOptions?: ScreenOptions;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
  onScreenDismissed?: (id: string) => void;
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
    <StackRenderer
      stack={stack}
      screens={screens}
      tabsRenderers={tabs}
      defaultScreenOptions={defaultScreenOptions}
      onFinishTransitioning={onFinishTransitioning}
      onScreenDismissed={onScreenDismissed}
      hasFocus
    >
      {!!modals.length && (
        <Screen isNativeStack stackPresentation="fullScreenModal">
          <StackRenderer
            stack={modals}
            screens={screens}
            tabsRenderers={tabs}
            defaultScreenOptions={defaultScreenOptions}
            onFinishTransitioning={onFinishTransitioning}
            onScreenDismissed={onScreenDismissed}
            hasFocus
            isModal
          />
        </Screen>
      )}
    </StackRenderer>
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

const StackRenderer = ({
  stack,
  screens,
  tabsRenderers,
  defaultScreenOptions,
  isModal,
  hasFocus,
  children,
  onScreenDismissed,
  onFinishTransitioning,
}: {
  stack: StackState;
  screens: ScreenMap;
  tabsRenderers: TabsMap;
  defaultScreenOptions?: ScreenOptions;
  isModal?: boolean;
  hasFocus?: boolean;
  children?: ReactNode;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
  onScreenDismissed?: (id: string) => void;
}) => {
  // bug in screen stack prevent null or false children to works
  // properly
  const childrenArray = React.Children.toArray(children);
  const childs: any[] = stack.map((routeInfo, index) => {
    const screenHasFocus =
      hasFocus && childrenArray.length === 0 && index === stack.length - 1;
    if (routeInfo.kind === 'tabs') {
      return (
        <Screen key={routeInfo.id} isNativeStack>
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
        isModal={isModal}
        hasFocus={screenHasFocus}
        isNativeStack
      />
    );
  });
  if (children) {
    childs.push(children);
  }
  return (
    <ScreenStack
      style={{ flex: 1 }}
      onFinishTransitioning={onFinishTransitioning}
    >
      {childs}
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
  defaultScreenOptions?: ScreenOptions;
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

          if (routeInfo.kind === 'stack') {
            return (
              <Screen
                key={routeInfo.id}
                activityState={currentIndex === index ? 2 : 0}
              >
                <StackRenderer
                  stack={routeInfo.state}
                  screens={screens}
                  tabsRenderers={tabsRenderers}
                  defaultScreenOptions={defaultScreenOptions}
                  onFinishTransitioning={onFinishTransitioning}
                  onScreenDismissed={onScreenDismissed}
                  isModal
                  hasFocus={screenHasFocus}
                />
              </Screen>
            );
          }

          return (
            <ScreenRenderer
              key={routeInfo.id}
              id={routeInfo.id}
              activityState={currentIndex === index ? 2 : 0}
              {...routeInfo.state}
              defaultScreenOptions={defaultScreenOptions}
              screens={screens}
              onDismissed={() => onScreenDismissed?.(routeInfo.id)}
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

const ScreenRendererContext = React.createContext<{
  navigationEventEmitter: EventEmitter;
  setOptions: (
    value:
      | ScreenOptions
      | ((value: ScreenOptions | null) => ScreenOptions | null)
      | null,
  ) => void;
}>({
  navigationEventEmitter: new EventEmitter(),
  setOptions: () => void 0,
});

type ScreenRendererProps = Route & {
  id: string;
  screens: ScreenMap;
  activityState?: 0 | 1 | 2;
  isNativeStack?: boolean;
  defaultScreenOptions?: ScreenOptions;
  isModal?: boolean;
  hasFocus?: boolean;
  onDismissed(): void;
};

const ScreenRenderer = ({
  id,
  route,
  params,
  screens,
  activityState,
  defaultScreenOptions,
  isModal,
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

  const screenContextValue = useMemo(
    () => ({ navigationEventEmitter, hasFocus, setOptions }),
    [navigationEventEmitter, hasFocus],
  );

  if (!Component) {
    console.error(`Unknown component for route ${route}`);
    return null;
  }

  const screenView = (
    <ScreenRendererContext.Provider value={screenContextValue}>
      <Component screenId={id} hasFocus={hasFocus} route={{ route, params }} />
    </ScreenRendererContext.Provider>
  );

  const onDismissed = () => {
    navigationEventEmitter.emit('dismissed');
    onDismissedProp();
  };

  return (
    <Screen
      {...options}
      key={id}
      activityState={activityState}
      isNativeStack={isNativeStack}
      style={StyleSheet.absoluteFill}
      onAppear={() => navigationEventEmitter.emit('appear')}
      onWillAppear={() => navigationEventEmitter.emit('willAppear')}
      onDisappear={() => navigationEventEmitter.emit('disappear')}
      onWillDisappear={() => navigationEventEmitter.emit('willDisappear')}
      onDismissed={onDismissed}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {isModal ? (
          <View style={{ flex: 1, backgroundColor: 'white' }}>
            {screenView}
          </View>
        ) : (
          screenView
        )}
      </GestureHandlerRootView>
    </Screen>
  );
};

const getCurrentRouteFromState = ({
  modals,
  stack,
}: RouterState): BasicRoute => {
  let currentRoute: RouteInstance;
  if (modals.length) {
    currentRoute = modals[modals.length - 1];
  } else {
    currentRoute = stack[stack.length - 1];
  }
  while (currentRoute.kind !== 'route') {
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

const getActiveTabs = ({ modals, stack }: RouterState): TabsState | null => {
  let currentRoute: RouteInstance;
  if (modals.length) {
    currentRoute = modals[modals.length - 1];
  } else {
    currentRoute = stack[stack.length - 1];
  }
  let currentTabs: TabsState | null = null;
  while (currentRoute.kind !== 'route') {
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
