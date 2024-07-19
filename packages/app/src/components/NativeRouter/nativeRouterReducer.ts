import {
  getAllRoutesFromStack,
  getCurrentRouteFromState,
} from './routerHelper';
import type {
  RouterAction,
  RouterState,
  StackState,
  TabsState,
} from './routerTypes';

const stackReducer = (
  state: StackState,
  { type, payload }: RouterAction,
): StackState => {
  switch (type) {
    case 'SPLICE': {
      const { route, count } = payload;
      state = state.slice(0, state.length - count);
      if (route) {
        state.push(route);
      }
      return state;
    }
    case 'SCREEN_DISMISSED': {
      const routerIndex = state.findIndex(
        routeInfo => routeInfo.id === payload.id,
      );
      if (routerIndex === -1) {
        return state;
      }
      return [...state.slice(0, routerIndex), ...state.slice(routerIndex + 1)];
    }
    default:
      return state;
  }
};

const tabsReducer = (
  state: TabsState,
  { type, payload }: RouterAction,
): TabsState => {
  switch (type) {
    case 'SET_TAB':
      return {
        ...state,
        currentIndex: payload.tabIndex,
        tabsHistory: [...state.tabsHistory, state.currentIndex],
      };
    case 'TAB_BACK':
      if (state.tabsHistory.length === 0) {
        return state;
      }
      return {
        ...state,
        currentIndex: state.tabsHistory[state.tabsHistory.length - 1],
        tabsHistory: state.tabsHistory.slice(0, state.tabsHistory.length - 1),
      };
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
    if (tabScreen.kind === 'stack') {
      return [
        ...stack.slice(0, stack.length - 1),
        {
          ...lastScreen,
          state: {
            ...lastScreen.state,
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
        ...state,
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

const routerStackReducer = (
  state: RouterState,
  action: RouterAction,
): RouterState => {
  switch (action.type) {
    case 'SCREEN_DISMISSED':
    case 'SPLICE': {
      const newStack = applyActionToDeepestStack(state.stack, action);
      if (newStack !== state.stack) {
        return {
          ...state,
          stack: newStack,
        };
      }
      return state;
    }
    case 'TAB_BACK':
    case 'SET_TAB': {
      const stack = state.stack;
      const lastScreen = stack[stack.length - 1];
      if (lastScreen.kind === 'tabs') {
        const newState = applyActionToDeepestTabs(lastScreen.state, action);
        if (newState !== lastScreen.state) {
          return {
            ...state,
            stack: [
              ...stack.slice(0, stack.length - 1),
              { ...lastScreen, state: newState },
            ],
          };
        }
        return state;
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

const nativeRouterReducer = (
  state: RouterState,
  action: RouterAction,
): RouterState => {
  state = routerStackReducer(state, action);
  const routes = getAllRoutesFromStack(state.stack);
  const screenIds = routes.reduce((acc, route) => {
    acc.add(route.id);
    return acc;
  }, new Set<string>());

  if (state.modals.some(modal => !screenIds.has(modal.ownerId))) {
    state = {
      ...state,
      modals: state.modals.filter(modal => screenIds.has(modal.ownerId)),
    };
  }

  const currentRoute = getCurrentRouteFromState(state);
  if (!currentRoute) {
    return state;
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
    case 'UPDATE_MODAL': {
      const { modalId, animationType, content, gestureEnabled } =
        action.payload;
      const index = state.modals.findIndex(modal => modal.id === modalId);
      if (index === -1) {
        return state;
      }
      const modal = state.modals[index];
      return {
        stack: state.stack,
        modals: [
          ...state.modals.slice(0, index),
          {
            ...modal,
            children: content,
            gestureEnabled,
            animationType,
          },
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
    case 'SCREEN_DISMISSED': {
      const index = state.modals.findIndex(
        modal => modal.id === action.payload.id,
      );
      if (index === -1) {
        return state;
      }
      return {
        stack: state.stack,
        modals: [
          ...state.modals.slice(0, index),
          ...state.modals.slice(index + 1),
        ],
      };
    }
    default:
      return state;
  }
};

export default nativeRouterReducer;
