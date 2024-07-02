import type {
  BasicRoute,
  RouteInstance,
  RouterState,
  StackState,
  TabsState,
} from './routerTypes';

export const getCurrentRouteFromState = ({
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

export const getAllRoutesFromStack = (
  state: StackState,
  routes: BasicRoute[] = [],
) => {
  for (let i = state.length - 1; i >= 0; i--) {
    const screen = state[i];
    if (screen.kind === 'route') {
      routes.push(screen);
    } else if (screen.kind === 'tabs') {
      const { currentIndex, tabs, lazy, unmountInactive, tabsHistory } =
        screen.state;
      const activeTabs = unmountInactive
        ? [tabs[currentIndex]]
        : lazy
          ? tabs.filter(
              (_, index) =>
                tabsHistory.includes(index) || index === currentIndex,
            )
          : tabs;

      activeTabs.forEach(screen => {
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

export const getActiveTabs = ({ stack }: RouterState): TabsState | null => {
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

export function dispatchToListeners<
  T extends (...args: any) => any,
  U extends Parameters<T>,
>(listeners: T[], ...args: U) {
  listeners.forEach(listener => listener(...(args as any)));
}
