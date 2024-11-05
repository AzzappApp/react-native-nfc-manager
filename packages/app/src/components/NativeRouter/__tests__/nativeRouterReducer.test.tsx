import React from 'react';
import nativeRouterReducer from '../nativeRouterReducer';
import type { Route } from '#routes';
import type {
  RouterState,
  RouterAction,
  TabsRoute,
  StackRoute,
} from '../routerTypes';

const initialState: RouterState = {
  stack: [{ id: 'home', kind: 'route', state: {} as Route }],
  modals: [],
};

describe('nativeRouterReducer', () => {
  it('should handle SPLICE action', () => {
    const state: RouterState = {
      ...initialState,
      stack: [
        ...initialState.stack,
        { id: 'second', kind: 'route', state: {} as Route },
      ],
    };

    const action: RouterAction = {
      type: 'SPLICE',
      payload: {
        route: { id: 'new-route', kind: 'route', state: {} as Route },
        count: 1,
      },
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.stack).toHaveLength(2);
    expect(newState.stack[1].id).toBe('new-route');
  });

  it('should splice multiple routes and add a new route', () => {
    const state: RouterState = {
      ...initialState,
      stack: [
        ...initialState.stack,
        { id: 'second', kind: 'route', state: {} as Route },
        { id: 'third', kind: 'route', state: {} as Route },
      ],
    };

    const action: RouterAction = {
      type: 'SPLICE',
      payload: {
        route: { id: 'new-route', kind: 'route', state: {} as Route },
        count: 2,
      },
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.stack).toHaveLength(2);
    expect(newState.stack[0].id).toBe('home');
    expect(newState.stack[1].id).toBe('new-route');
  });

  it('should splice within a nested tabs structure', () => {
    const state: RouterState = {
      stack: [
        {
          id: 'tabs',
          kind: 'tabs',
          state: {
            lazy: false,
            unmountInactive: false,
            tabsHistory: [],
            tabs: [
              { id: 'tab1', kind: 'route', state: {} as Route },
              {
                id: 'tab2',
                kind: 'stack',
                state: [
                  { id: 'tab2-nested-home', kind: 'route', state: {} as Route },
                  {
                    id: 'tab2-nested-second',
                    kind: 'route',
                    state: {} as Route,
                  },
                ],
              },
            ],
            currentIndex: 1,
          },
        },
      ],
      modals: [],
    };

    const action: RouterAction = {
      type: 'SPLICE',
      payload: {
        route: { id: 'new-tab-route', kind: 'route', state: {} as Route },
        count: 1,
      },
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.stack).toHaveLength(1);
    const tabs = newState.stack[0] as TabsRoute;
    expect(tabs.state.tabs[1].kind).toBe('stack');
    const nestedStack = tabs.state.tabs[1] as StackRoute;
    expect(nestedStack.state).toHaveLength(2);
    expect(nestedStack.state[1].id).toBe('new-tab-route');
  });

  it('should splice and remove routes correctly', () => {
    const action: RouterAction = {
      type: 'SPLICE',
      payload: { count: 2 },
    };
    const state: RouterState = {
      ...initialState,
      stack: [
        ...initialState.stack,
        { id: 'second', kind: 'route', state: {} as Route },
        { id: 'third', kind: 'route', state: {} as Route },
      ],
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.stack).toHaveLength(1);
    expect(newState.stack[0].id).toBe('home');
  });

  it('should splice and handle nested stack within tabs', () => {
    const action: RouterAction = {
      type: 'SPLICE',
      payload: {
        route: { id: 'new-nested-route', kind: 'route', state: {} as Route },
        count: 1,
      },
    };
    const state: RouterState = {
      stack: [
        {
          id: 'main-tabs',
          kind: 'tabs',
          state: {
            lazy: false,
            unmountInactive: false,
            tabsHistory: [],
            tabs: [
              { id: 'tab1', kind: 'route', state: {} as Route },
              {
                id: 'tab2',
                kind: 'stack',
                state: [
                  { id: 'stack-home', kind: 'route', state: {} as Route },
                  { id: 'stack-second', kind: 'route', state: {} as Route },
                ],
              },
            ],
            currentIndex: 1,
          },
        },
      ],
      modals: [],
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.stack).toHaveLength(1);
    expect(newState.stack[0].kind).toBe('tabs');
    const tabs = newState.stack[0] as TabsRoute;
    expect(tabs.state.tabs[1].kind).toBe('stack');
    const nestedStack = tabs.state.tabs[1] as StackRoute;
    expect(nestedStack.state).toHaveLength(2);
    expect(nestedStack.state[1].id).toBe('new-nested-route');
  });

  it('should handle SHOW_MODAL action', () => {
    const action: RouterAction = {
      type: 'SHOW_MODAL',
      payload: {
        descriptor: {
          id: 'modal1',
          animationType: 'fade',
          gestureEnabled: true,
        },
        initialContent: <div>Modal Content</div>,
      },
    };

    const newState = nativeRouterReducer(initialState, action);
    expect(newState.modals).toHaveLength(1);
    expect(newState.modals[0].id).toBe('modal1');
    expect(newState.modals[0].children).toEqual(action.payload.initialContent);
  });

  it('should handle UPDATE_MODAL action', () => {
    const action: RouterAction = {
      type: 'UPDATE_MODAL',
      payload: {
        modalId: 'modal1',
        animationType: 'slide',
        content: <div>New Content</div>,
        gestureEnabled: false,
      },
    };

    const state: RouterState = {
      ...initialState,
      modals: [
        {
          id: 'modal1',
          ownerId: 'home',
          animationType: 'fade',
          children: <div>Old Content</div>,
          gestureEnabled: true,
        },
      ],
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.modals).toHaveLength(1);
    expect(newState.modals[0].children).toEqual(action.payload.content);
    expect(newState.modals[0].gestureEnabled).toBe(false);
    expect(newState.modals[0].animationType).toBe('slide');
  });

  it('should handle HIDE_MODAL action', () => {
    const action: RouterAction = {
      type: 'HIDE_MODAL',
      payload: { modalId: 'modal1' },
    };

    const state: RouterState = {
      ...initialState,
      modals: [
        {
          id: 'modal1',
          ownerId: 'home',
          animationType: 'fade',
          children: <div>Content</div>,
          gestureEnabled: true,
        },
      ],
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.modals).toHaveLength(0);
  });

  it('should handle BACK_TO_TOP action', () => {
    const action: RouterAction = {
      type: 'BACK_TO_TOP',
      payload: undefined,
    };

    const state: RouterState = {
      ...initialState,
      stack: [
        ...initialState.stack,
        { id: 'second', kind: 'route', state: {} as Route },
      ],
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.stack).toHaveLength(1);
    expect(newState.stack[0].id).toBe('home');
  });

  it('should handle REPLACE_ALL action', () => {
    const action: RouterAction = {
      type: 'REPLACE_ALL',
      payload: {
        stack: [{ id: 'new-home', kind: 'route', state: {} as Route }],
        modals: [],
      },
    };

    const newState = nativeRouterReducer(initialState, action);
    expect(newState.stack).toHaveLength(1);
    expect(newState.stack[0].id).toBe('new-home');
  });

  it('should handle SCREEN_DISMISSED action', () => {
    const action: RouterAction = {
      type: 'SCREEN_DISMISSED',
      payload: { id: 'second' },
    };

    const state: RouterState = {
      ...initialState,
      stack: [
        ...initialState.stack,
        { id: 'second', kind: 'route', state: {} as Route },
      ],
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.stack).toHaveLength(1);
    expect(newState.stack[0].id).toBe('home');
  });

  it('should handle SCREEN_DISMISSED action with modal', () => {
    const action: RouterAction = {
      type: 'SCREEN_DISMISSED',
      payload: { id: 'modal1' },
    };

    const state: RouterState = {
      ...initialState,
      modals: [
        {
          id: 'modal1',
          ownerId: 'home',
          animationType: 'fade',
          children: <div>Content</div>,
          gestureEnabled: true,
        },
      ],
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.modals).toHaveLength(0);
  });

  it('should remove all modals belonging to a screen when this screen is removed', () => {
    const state: RouterState = {
      stack: [
        { id: 'home', kind: 'route', state: {} as Route },
        { id: 'login', kind: 'route', state: {} as Route },
      ],
      modals: [
        {
          id: 'modal1',
          ownerId: 'home',
          animationType: 'fade',
          children: <div>Content</div>,
          gestureEnabled: true,
        },
        {
          id: 'modal2',
          ownerId: 'login',
          animationType: 'fade',
          children: <div>Content</div>,
          gestureEnabled: true,
        },
        {
          id: 'modal3',
          ownerId: 'login',
          animationType: 'fade',
          children: <div>Content</div>,
          gestureEnabled: true,
        },
      ],
    };
    const action: RouterAction = {
      type: 'SCREEN_DISMISSED',
      payload: { id: 'login' },
    };
    const newState = nativeRouterReducer(state, action);
    expect(newState.modals).toHaveLength(1);
    expect(newState.modals[0].id).toBe('modal1');
  });

  it('should handle SET_TAB action', () => {
    const action: RouterAction = {
      type: 'SET_TAB',
      payload: { tabIndex: 1 },
    };

    const state: RouterState = {
      stack: [
        {
          id: 'tabs',
          kind: 'tabs',
          state: {
            lazy: false,
            unmountInactive: false,
            tabsHistory: [],
            tabs: [
              { id: 'tab1', kind: 'route', state: {} as Route },
              { id: 'tab2', kind: 'route', state: {} as Route },
            ],
            currentIndex: 0,
          },
        },
      ],
      modals: [],
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.stack[0].kind).toBe('tabs');
    expect((newState.stack[0] as TabsRoute).state.currentIndex).toBe(1);
  });

  it('should handle TAB_BACK action', () => {
    const action: RouterAction = {
      type: 'TAB_BACK',
      payload: undefined,
    };

    const state: RouterState = {
      stack: [
        {
          id: 'tabs',
          kind: 'tabs',
          state: {
            lazy: false,
            unmountInactive: false,
            tabsHistory: [0],
            tabs: [
              { id: 'tab1', kind: 'route', state: {} as Route },
              { id: 'tab2', kind: 'route', state: {} as Route },
            ],
            currentIndex: 1,
          },
        },
      ],
      modals: [],
    };

    const newState = nativeRouterReducer(state, action);
    expect(newState.stack[0].kind).toBe('tabs');
    expect((newState.stack[0] as TabsRoute).state.tabsHistory).toEqual([]);
    expect((newState.stack[0] as TabsRoute).state.currentIndex).toBe(0);
  });
});
