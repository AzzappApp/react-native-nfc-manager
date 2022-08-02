// TODO add tabs
import { EventEmitter } from 'events';
import isEqual from 'lodash/isEqual';
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
import { ScreenContext, ScreenStack } from 'react-native-screens';
import { ReanimatedScreenProvider } from 'react-native-screens/reanimated';
import type {
  Router as PlatformRouter,
  RouteListener,
} from '../PlatformEnvironment';
import type { Route, ROUTES } from '../routes';
import type { ComponentType, ReactNode } from 'react';
import type { NativeSyntheticEvent, TargetedEvent } from 'react-native';
import type { ScreenProps } from 'react-native-screens';

type RouteInstance = Route & { id: string };

type PushAction = {
  type: 'PUSH';
  payload: RouteInstance;
};

type ReplaceAction = {
  type: 'REPLACE';
  payload: RouteInstance;
};

type ShowModalAction = {
  type: 'SHOW_MODAL';
  payload: RouteInstance;
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

type RouterAction =
  | BackAction
  | BackToTopAction
  | PushAction
  | ReplaceAction
  | ScreenDismissedAction
  | ShowModalAction;

// type TabsState = {
//   tabs: Routes[];
//   currenIndex: number;
// };

type StackState = RouteInstance[];

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

const routerReducer = (
  state: RouterState,
  action: RouterAction,
): RouterState => {
  switch (action.type) {
    case 'PUSH':
    case 'BACK':
    case 'REPLACE':
      if (state.modals.length) {
        return { ...state, modals: stackReducer(state.modals, action) };
      }
      return { ...state, stack: stackReducer(state.stack, action) };
    case 'SCREEN_DISMISSED':
      return {
        ...state,
        modals: stackReducer(state.modals, action),
        stack: stackReducer(state.stack, action),
      };
    case 'SHOW_MODAL':
      return {
        ...state,
        modals: [action.payload],
      };
    case 'BACK_TO_TOP':
      return {
        stack: [state.stack[0]],
        modals: [],
      };
    default:
      console.error(`Unknonw route action of type '${(action as any).type}'`);
      return state;
  }
};

type ScreenListener = (routeInfos: RouteInstance) => void;

export const createRouterInitialState = (
  route: Route,
  initialId?: string,
): RouterState => ({
  stack: [{ id: initialId ?? generateID(), ...route }],
  modals: [],
});

export type NativeRouter = PlatformRouter & {
  backToTop(): void;
  screenDismissed(id: string): void;
  addScreenWillBePushedListener: (listener: ScreenListener) => {
    dispose: () => void;
  };
  addScreenWillBeRemovedListener: (listener: ScreenListener) => {
    dispose: () => void;
  };
};

export const useNativeRouter = (initialState: RouterState) => {
  // We can't use useReducer since we to dispatch event before
  // the state change takes effect
  const [routerState, setRouterState] = useState(initialState);

  const routerStateRef = useRef(routerState);
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
      dispatchToListeners(routeWillChangeListeners, nextRoute);
    }
    setRouterState(newState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRoute = getCurrentRouteFromState(routerState);
  useEffect(() => {
    dispatchToListeners(routeDidChangeListeners, currentRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute]);

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
    return {
      getCurrentRoute,
      push(route: Route) {
        const id = (route as any).id ?? generateID();
        const routeInfo = { ...route, id };
        dispatchToListeners(screenWillBePushedListeners, routeInfo);
        dispatch({
          type: 'PUSH',
          payload: routeInfo,
        });
      },
      replace(route: Route) {
        const id = (route as any).id ?? generateID();
        const routeInfo = { ...route, id };
        dispatchToListeners(screenWillBeRemovedListeners, getCurrentRoute());
        dispatchToListeners(screenWillBePushedListeners, routeInfo);
        dispatch({
          type: 'REPLACE',
          payload: routeInfo,
        });
      },
      showModal(route: Route) {
        const id = (route as any).id ?? generateID();
        const routeInfo = { ...route, id };
        dispatchToListeners(screenWillBePushedListeners, routeInfo);
        dispatch({
          type: 'SHOW_MODAL',
          payload: routeInfo,
        });
      },
      back() {
        dispatchToListeners(screenWillBeRemovedListeners, getCurrentRoute());
        dispatch({
          type: 'BACK',
        });
      },
      backToTop() {
        const { stack, modals } = routerStateRef.current;
        modals.forEach(routeInfo =>
          dispatchToListeners(screenWillBeRemovedListeners, routeInfo),
        );
        stack
          .slice(1)
          .forEach(routeInfo =>
            dispatchToListeners(screenWillBeRemovedListeners, routeInfo),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  route: T;
};

type ScreenMap = Record<ROUTES, ComponentType<NativeScreenProps<any>>>;

type ScreensRendererProps = {
  routerState: RouterState;
  screens: ScreenMap;
  defaultScreenOptions?: ScreenOptions;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
  onScreenDismissed?: (id: string) => void;
};

export const ScreensRenderer = ({
  routerState,
  screens,
  defaultScreenOptions,
  onFinishTransitioning,
  onScreenDismissed,
}: ScreensRendererProps) => {
  const { stack, modals } = routerState;
  const Screen = useContext(ScreenContext);
  return (
    <ReanimatedScreenProvider>
      <StackRenderer
        stack={stack}
        screens={screens}
        defaultScreenOptions={defaultScreenOptions}
        onFinishTransitioning={onFinishTransitioning}
        onScreenDismissed={onScreenDismissed}
      >
        {!!modals.length && (
          <Screen
            key="nativeRouterModal"
            enabled
            isNativeStack
            style={StyleSheet.absoluteFill}
            stackPresentation="modal"
          >
            <StackRenderer
              stack={modals}
              screens={screens}
              defaultScreenOptions={defaultScreenOptions}
              onFinishTransitioning={onFinishTransitioning}
              onScreenDismissed={onScreenDismissed}
              isModal
            />
          </Screen>
        )}
      </StackRenderer>
    </ReanimatedScreenProvider>
  );
};

const StackRenderer = ({
  stack,
  screens,
  defaultScreenOptions,
  isModal,
  children,
  onScreenDismissed,
  onFinishTransitioning,
}: {
  stack: StackState;
  screens: ScreenMap;
  defaultScreenOptions?: ScreenOptions;
  isModal?: boolean;
  children?: ReactNode;
  onFinishTransitioning?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
  onScreenDismissed?: (id: string) => void;
}) => {
  const [displayedStack, setDisplayedStack] = useState(stack);

  useEffect(() => {
    if (!isEqual(displayedStack, stack)) {
      setDisplayedStack(stack);
    }
  }, [displayedStack, stack]);

  return (
    <ScreenStack
      style={{ flex: 1 }}
      onFinishTransitioning={onFinishTransitioning}
    >
      {displayedStack.map(routeInfo => (
        <ScreenRenderer
          key={routeInfo.id}
          {...routeInfo}
          defaultScreenOptions={defaultScreenOptions}
          screens={screens}
          onDismissed={() => onScreenDismissed?.(routeInfo.id)}
          isModal={isModal}
        />
      ))}
      {children}
    </ScreenStack>
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
}>({ navigationEventEmitter: new EventEmitter(), setOptions: () => void 0 });

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

type ScreenRendererProps = Route & {
  id: string;
  screens: ScreenMap;
  defaultScreenOptions?: ScreenOptions;
  isModal?: boolean;
  onDismissed(): void;
};

const ScreenRenderer = ({
  id,
  route,
  params,
  screens,
  defaultScreenOptions,
  isModal,
  onDismissed: onDismissedProp,
}: ScreenRendererProps) => {
  const Component: any = screens[route];

  const navigationEventEmitter = useRef(new EventEmitter()).current;

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
      options = { ...options, ...Component.getScreenOptions(params) };
    }
    return options;
  });

  const screenContextValue = useMemo(
    () => ({ navigationEventEmitter, setOptions }),
    [navigationEventEmitter],
  );

  const Screen = useContext(ScreenContext);
  if (!Component) {
    console.error(`Unknown component for route ${route}`);
    return null;
  }

  const screenView = (
    <ScreenRendererContext.Provider value={screenContextValue}>
      <Component screenId={id} route={{ route, params }} />
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
      enabled
      isNativeStack
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

const generateID = () => Math.random().toString().split('.')[1];

const getCurrentRouteFromState = ({
  modals,
  stack,
}: RouterState): RouteInstance => {
  if (modals.length) {
    return modals[modals.length - 1];
  }
  return stack[stack.length - 1];
};

function dispatchToListeners<
  T extends (...args: any) => any,
  U extends Parameters<T>,
>(listeners: T[], ...args: U) {
  listeners.forEach(listener => listener(...(args as any)));
}
