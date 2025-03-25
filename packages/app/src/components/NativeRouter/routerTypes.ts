import type { Route } from '#routes';
import type { ReactNode } from 'react';
import type { ScreenProps } from 'react-native-screens';

//#region Router State
export type RouterState = {
  stack: StackState;
  modals: Array<ModalDescriptor & { children: ReactNode }>;
};

export type StackRoute = { id: string; kind: 'stack'; state: StackState };
export type StackState = Array<Exclude<RouteInstance, StackRoute>>;

export type TabsRoute = { id: string; kind: 'tabs'; state: TabsState };

export type TabsState = {
  currentIndex: number;
  tabs: Array<Exclude<RouteInstance, TabsRoute>>;
  lazy: boolean;
  unmountInactive: boolean;
  tabsHistory: number[];
  screenOptions?: ScreenOptions;
};

export type BasicRoute = { id: string; kind: 'route'; state: Route };

export type RouteInstance = BasicRoute | StackRoute | TabsRoute;

export type ModalDescriptor = {
  id: string;
  ownerId: string;
  animationType: 'fade' | 'none' | 'slide';
  gestureEnabled: boolean;
};

//#endregion

//#region Router Actions
export type SpliceAction = {
  type: 'SPLICE';
  payload: { route?: Exclude<RouteInstance, StackRoute> | null; count: number };
};

export type ShowModalAction = {
  type: 'SHOW_MODAL';
  payload: {
    descriptor: Omit<ModalDescriptor, 'ownerId'>;
    initialContent: ReactNode;
  };
};

export type HideModalAction = {
  type: 'HIDE_MODAL';
  payload: { modalId: string };
};

export type UpdateModalAction = {
  type: 'UPDATE_MODAL';
  payload: {
    modalId: string;
    content: ReactNode;
    gestureEnabled: boolean;
    animationType: 'fade' | 'none' | 'slide';
  };
};

export type BackToTopAction = {
  type: 'BACK_TO_TOP';
  payload?: undefined;
};

export type ScreenDismissedAction = {
  type: 'SCREEN_DISMISSED';
  payload: { id: string };
};

export type SetTabAction = {
  type: 'SET_TAB';
  payload: { tabIndex: number };
};

export type TabBackAction = {
  type: 'TAB_BACK';
  payload?: undefined;
};

export type ReplaceAllAction = {
  type: 'REPLACE_ALL';
  payload: RouterState;
};

export type RouterAction =
  | BackToTopAction
  | HideModalAction
  | ReplaceAllAction
  | ScreenDismissedAction
  | SetTabAction
  | ShowModalAction
  | SpliceAction
  | TabBackAction
  | UpdateModalAction;

//#endregion

//#region Router Init
export type RouteInit = Route & { id: string };

export type TabsInit = {
  id: string;
  tabs: Array<RouteInit | StackInit>;
  currentIndex: number;
  lazy?: boolean;
  unmountInactive?: boolean;
  screenOptions?: ScreenOptions;
};

export type StackInit = { stack: Array<RouteInit | TabsInit> };

export type RouterInit = {
  id: string;
  stack: Array<RouteInit | TabsInit>;
};
//#endregion

// #region Events
export type NativeNavigationEvent =
  | 'appear'
  | 'disappear'
  | 'dismissed'
  | 'willAppear'
  | 'willDisappear';
//#endregion

//#region Screen Options

export type NativeScreenProps<T extends Route> = {
  screenId: string;
  hasFocus: boolean;
  route: T;
};

export type ScreenOptions = Omit<
  ScreenProps,
  | 'active'
  | 'activityState'
  | 'children'
  | 'hideKeyboardOnSwipe'
  | 'onAppear'
  | 'onDisappear'
  | 'onDismissed'
  | 'onHeaderBackButtonClicked'
  | 'onTransitionProgress'
  | 'onTransitionProgress'
  | 'onWillDisappear'
>;
// #endregion
