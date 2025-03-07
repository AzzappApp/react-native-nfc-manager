import {
  getCurrentRouteFromState,
  getAllRoutesFromStack,
  getActiveTabs,
  dispatchToListeners,
} from '../routerHelper';
import type { Route } from '#routes';
import type { RouterState, StackState } from '../routerTypes';

describe('routerHelper', () => {
  describe('getCurrentRouteFromState', () => {
    test('should return the current route from a simple stack', () => {
      const state: RouterState = {
        stack: [
          { id: 'home', kind: 'route', state: {} as Route },
          { id: 'details', kind: 'route', state: {} as Route },
        ],
        modals: [],
      };

      const currentRoute = getCurrentRouteFromState(state);
      expect(currentRoute?.id).toBe('details');
    });

    test('should return the current route from a nested tabs', () => {
      const state: RouterState = {
        stack: [
          {
            id: 'tabs',
            kind: 'tabs',
            state: {
              currentIndex: 1,
              lazy: false,
              unmountInactive: false,
              tabsHistory: [],
              tabs: [
                { id: 'tab1', kind: 'route', state: {} as Route },
                { id: 'tab2', kind: 'route', state: {} as Route },
              ],
            },
          },
        ],
        modals: [],
      };

      const currentRoute = getCurrentRouteFromState(state);
      expect(currentRoute?.id).toBe('tab2');
    });

    test('should return null if stack is empty', () => {
      const state: RouterState = {
        stack: [],
        modals: [],
      };

      const currentRoute = getCurrentRouteFromState(state);
      expect(currentRoute).toBeNull();
    });
  });

  describe('getAllRoutesFromStack', () => {
    test('should return all routes from a simple stack', () => {
      const state: StackState = [
        { id: 'home', kind: 'route', state: {} as Route },
        { id: 'details', kind: 'route', state: {} as Route },
      ];

      const routes = getAllRoutesFromStack(state);
      expect(routes).toHaveLength(2);
      expect(routes[0].id).toBe('details');
      expect(routes[1].id).toBe('home');
    });

    test('should return all routes from a nested tabs', () => {
      const state: StackState = [
        {
          id: 'tabs',
          kind: 'tabs',
          state: {
            currentIndex: 1,
            lazy: false,
            unmountInactive: false,
            tabsHistory: [],
            tabs: [
              { id: 'tab1', kind: 'route', state: {} as Route },
              { id: 'tab2', kind: 'route', state: {} as Route },
            ],
          },
        },
      ];

      const routes = getAllRoutesFromStack(state);
      expect(routes).toHaveLength(2);
      expect(routes[0].id).toBe('tab1');
      expect(routes[1].id).toBe('tab2');
    });

    test('should return not inactive tabs', () => {
      let state: StackState = [
        {
          id: 'tabs',
          kind: 'tabs',
          state: {
            currentIndex: 1,
            lazy: false,
            unmountInactive: true,
            tabsHistory: [],
            tabs: [
              { id: 'tab1', kind: 'route', state: {} as Route },
              { id: 'tab2', kind: 'route', state: {} as Route },
            ],
          },
        },
      ];

      let routes = getAllRoutesFromStack(state);
      expect(routes).toHaveLength(1);
      expect(routes[0].id).toBe('tab2');

      state = [
        {
          id: 'tabs',
          kind: 'tabs',
          state: {
            currentIndex: 1,
            lazy: true,
            unmountInactive: false,
            tabsHistory: [],
            tabs: [
              { id: 'tab1', kind: 'route', state: {} as Route },
              { id: 'tab2', kind: 'route', state: {} as Route },
            ],
          },
        },
      ];

      routes = getAllRoutesFromStack(state);
      expect(routes).toHaveLength(1);
      expect(routes[0].id).toBe('tab2');

      state = [
        {
          id: 'tabs',
          kind: 'tabs',
          state: {
            currentIndex: 1,
            lazy: true,
            unmountInactive: false,
            tabsHistory: [0],
            tabs: [
              { id: 'tab1', kind: 'route', state: {} as Route },
              { id: 'tab2', kind: 'route', state: {} as Route },
            ],
          },
        },
      ];

      routes = getAllRoutesFromStack(state);
      expect(routes).toHaveLength(2);
      expect(routes[0].id).toBe('tab1');
      expect(routes[1].id).toBe('tab2');
    });
  });

  describe('getActiveTabs', () => {
    test('should return active tabs state from a nested tabs', () => {
      const state: RouterState = {
        stack: [
          {
            id: 'tabs',
            kind: 'tabs',
            state: {
              currentIndex: 1,
              lazy: false,
              unmountInactive: false,
              tabsHistory: [],
              tabs: [
                { id: 'tab1', kind: 'route', state: {} as Route },
                { id: 'tab2', kind: 'route', state: {} as Route },
              ],
            },
          },
        ],
        modals: [],
      };

      const activeTabs = getActiveTabs(state);
      expect(activeTabs?.currentIndex).toBe(1);
    });

    test('should return null if no tabs in stack', () => {
      const state: RouterState = {
        stack: [{ id: 'home', kind: 'route', state: {} as Route }],
        modals: [],
      };

      const activeTabs = getActiveTabs(state);
      expect(activeTabs).toBeNull();
    });
  });

  describe('dispatchToListeners', () => {
    test('should call all listeners with provided arguments', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listeners = [listener1, listener2];
      const args = ['arg1', 'arg2'];

      dispatchToListeners(listeners, ...args);
      expect(listener1).toHaveBeenCalledWith(...args);
      expect(listener2).toHaveBeenCalledWith(...args);
    });
  });
});
