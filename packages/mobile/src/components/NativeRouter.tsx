import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ScreenStack, Screen } from 'react-native-screens';
import type {
  Router as PlatformRouter,
  RouteListener,
} from '@azzapp/app/lib/PlatformEnvironment';
import type { Routes } from '@azzapp/shared/lib/routes';
import type { ComponentType } from 'react';
import type { ScreenProps } from 'react-native-screens';

type RouteInfos = { id: string; route: Routes; params?: any };

type PushAction = {
  type: 'PUSH';
  payload: RouteInfos;
};

type ReplaceAction = {
  type: 'REPLACE';
  payload: RouteInfos;
};

type ShowModalAction = {
  type: 'SHOW_MODAL';
  payload: RouteInfos;
};

type BackAction = {
  type: 'BACK';
  payload?: undefined;
};

type BackToTopAction = {
  type: 'BACK_TO_TOP';
  payload?: undefined;
};

type SetCurrentTabAction = {
  type: 'SET_CURRENT_TAB';
  payload: {
    route: Routes;
  };
};

type RouterAction =
  | BackAction
  | BackToTopAction
  | PushAction
  | ReplaceAction
  | SetCurrentTabAction
  | ShowModalAction;

// type TabsState = {
//   tabs: Routes[];
//   currenIndex: number;
// };

type StackState = RouteInfos[];

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
    case 'SET_CURRENT_TAB':
      if (state.modals.length) {
        return { ...state, modals: stackReducer(state.modals, action) };
      }
      return { ...state, stack: stackReducer(state.stack, action) };
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

type ScreenListener = (routeInfos: RouteInfos) => void;

export const createRouterInitialState = ({
  route,
  params,
  id,
}: {
  route: Routes;
  id?: string;
  params?: any;
}): RouterState => ({
  stack: [{ id: id ?? generateID(), route, params }],
  modals: [],
});

export type NativeRouter = PlatformRouter & {
  backToTop(): void;
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
    const nextRoute = getCurrentRouteFromState(routerStateRef.current);
    if (nextRoute !== currentRoute) {
      dispatchToListeners(
        routeWillChangeListeners,
        nextRoute.route,
        nextRoute.params,
      );
    }
    setRouterState(newState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRoute = getCurrentRouteFromState(routerState);
  useEffect(() => {
    dispatchToListeners(
      routeDidChangeListeners,
      currentRoute.route,
      currentRoute.params,
    );
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
      push(route: Routes, params?: any) {
        const routeInfo = { route, params, id: generateID() };
        dispatchToListeners(screenWillBePushedListeners, routeInfo);
        dispatch({
          type: 'PUSH',
          payload: routeInfo,
        });
      },
      replace(route: Routes, params?: any) {
        const routeInfo = { route, params, id: generateID() };
        dispatchToListeners(screenWillBeRemovedListeners, getCurrentRoute());
        dispatchToListeners(screenWillBePushedListeners, routeInfo);
        dispatch({
          type: 'REPLACE',
          payload: routeInfo,
        });
      },
      showModal(route: Routes, params?: any) {
        const routeInfo = { route, params, id: generateID() };
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

type ScreensRendererProps = {
  routerState: RouterState;
  screens: Record<Routes, ComponentType<any>>;
  defaultScreenOptions?: ScreenOptions;
};

export const ScreensRenderer = ({
  routerState,
  screens,
  defaultScreenOptions,
}: ScreensRendererProps) => {
  const { stack, modals } = routerState;
  return (
    <ScreenStack style={{ flex: 1 }}>
      {stack.map(routeInfo => (
        <ScreenRenderer
          key={routeInfo.id}
          {...routeInfo}
          defaultScreenOptions={defaultScreenOptions}
          screens={screens}
        />
      ))}
      {!!modals.length && (
        <Screen
          key="nativeRouterModal"
          enabled
          isNativeStack
          style={StyleSheet.absoluteFill}
          stackPresentation="modal"
        >
          <ScreenStack style={{ flex: 1 }}>
            {modals.map(routeInfo => (
              <ScreenRenderer
                key={routeInfo.id}
                {...routeInfo}
                defaultScreenOptions={defaultScreenOptions}
                screens={screens}
                isModal
              />
            ))}
          </ScreenStack>
        </Screen>
      )}
    </ScreenStack>
  );
};

type ScreenRendererProps = {
  id: string;
  route: Routes;
  params?: any;
  screens: Record<Routes, ComponentType<any>>;
  defaultScreenOptions?: ScreenOptions;
  isModal?: boolean;
};

const ScreenRenderer = ({
  id,
  route,
  params,
  screens,
  defaultScreenOptions,
  isModal,
}: ScreenRendererProps) => {
  const Component: any = screens[route];
  if (!Component) {
    console.error(`Unknown component for route ${route}`);
    return null;
  }
  let options: ScreenOptions | null = defaultScreenOptions ?? null;
  if (typeof Component.options === 'object') {
    options = { ...options, ...Component.options };
  }
  if (typeof Component.getScreenOptions === 'function') {
    options = { ...options, ...Component.getScreenOptions(params) };
  }
  return (
    <Screen
      {...options}
      key={id}
      enabled
      isNativeStack
      style={StyleSheet.absoluteFill}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {isModal ? (
          <View style={{ flex: 1, backgroundColor: 'white' }}>
            <Component screenId={id} route={route} params={params} />
          </View>
        ) : (
          <Component screenId={id} route={route} params={params} />
        )}
      </GestureHandlerRootView>
    </Screen>
  );
};

const generateID = () => Math.random().toString().split('.')[1];

const getCurrentRouteFromState = ({
  modals,
  stack,
}: RouterState): RouteInfos => {
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
