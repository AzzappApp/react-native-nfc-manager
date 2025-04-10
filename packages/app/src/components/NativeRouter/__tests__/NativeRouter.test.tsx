import { renderHook, act } from '@testing-library/react-hooks';
import { BackHandler } from 'react-native';
import { createDeferred } from '@azzapp/shared/asyncHelpers';
import { useNativeRouter } from '../NativeRouter';
import type { BasicRoute, RouterInit } from '../routerTypes';
import type { Deferred } from '@azzapp/shared/asyncHelpers';

jest.mock('#helpers/idHelpers', () => ({
  createId: jest.fn(() => 'generated-id'),
}));

jest.mock('react-native', () => ({
  BackHandler: {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
}));

describe('useNativeRouter', () => {
  const init: RouterInit = {
    id: 'root',
    stack: [{ id: 'HOME', route: 'HOME', params: undefined }],
  };

  test('should initialize router state', () => {
    const { result } = renderHook(() => {
      return useNativeRouter({
        id: 'test',
        stack: [
          {
            id: 'MAIN_TABS',
            tabs: [
              {
                stack: [
                  { id: 'HOME', route: 'HOME' },
                  {
                    id: 'USER_2',
                    route: 'WEBCARD',
                    params: { userName: 'user-2' },
                  },
                ],
              },
              { id: 'SEARCH', route: 'SEARCH' },
            ],
            currentIndex: 1,
          },
          { id: 'NEW_POST', route: 'NEW_POST' },
        ],
      });
    });

    expect(result.current.routerState).toMatchInlineSnapshot(`
      {
        "modals": [],
        "stack": [
          {
            "id": "MAIN_TABS",
            "kind": "tabs",
            "state": {
              "currentIndex": 1,
              "lazy": true,
              "screenOptions": undefined,
              "tabs": [
                {
                  "id": "generated-id",
                  "kind": "stack",
                  "state": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "USER_2",
                      "kind": "route",
                      "state": {
                        "params": {
                          "userName": "user-2",
                        },
                        "route": "WEBCARD",
                      },
                    },
                  ],
                },
                {
                  "id": "SEARCH",
                  "kind": "route",
                  "state": {
                    "route": "SEARCH",
                  },
                },
              ],
              "tabsHistory": [],
              "unmountInactive": false,
            },
          },
          {
            "id": "NEW_POST",
            "kind": "route",
            "state": {
              "route": "NEW_POST",
            },
          },
        ],
      }
    `);
  });

  describe('router.getCurrentRoute', () => {
    test('should return the modal route if any', () => {
      const { result } = renderHook(() => {
        return useNativeRouter({
          id: 'test',
          stack: [
            {
              id: 'MAIN_TABS',
              tabs: [
                {
                  stack: [
                    { id: 'HOME', route: 'HOME' },
                    {
                      id: 'USER_2',
                      route: 'WEBCARD',
                      params: { userName: 'user-2' },
                    },
                  ],
                },
                { id: 'SEARCH', route: 'SEARCH' },
              ],
              currentIndex: 1,
            },
            { id: 'NEW_POST', route: 'NEW_POST' },
          ],
        });
      });

      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'NEW_POST',
      });
    });

    test('should return the current tab if any', () => {
      const { result } = renderHook(() => {
        return useNativeRouter({
          id: 'test',
          stack: [
            { id: 'NEW_POST', route: 'NEW_POST' },
            {
              id: 'MAIN_TABS',
              tabs: [
                {
                  stack: [
                    { id: 'HOME', route: 'HOME' },
                    {
                      id: 'USER_2',
                      route: 'WEBCARD',
                      params: { userName: 'user-2' },
                    },
                  ],
                },
                { id: 'SEARCH', route: 'SEARCH' },
              ],
              currentIndex: 1,
            },
          ],
        });
      });

      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'SEARCH',
      });
    });
  });

  describe('router navigation', () => {
    test('should handle push action', () => {
      const { result } = renderHook(() => useNativeRouter(init));

      act(() => {
        result.current.router.push({ route: 'SIGN_IN', params: undefined });
      });

      expect(result.current.routerState.stack).toHaveLength(2);
      const route = result.current.routerState.stack[1];
      expect((route as BasicRoute).state.route).toBe('SIGN_IN');
    });

    test('should handle push action with tabs', () => {
      const { result } = renderHook(() => {
        return useNativeRouter({
          id: 'test',
          stack: [
            { id: 'NEW_POST', route: 'NEW_POST' },
            {
              id: 'MAIN_TABS',
              tabs: [
                { id: 'HOME', route: 'HOME' },
                { id: 'SEARCH', route: 'SEARCH' },
              ],
              currentIndex: 0,
            },
          ],
        });
      });

      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'HOME',
      });

      act(() => {
        result.current.router.push({ route: 'SEARCH', params: undefined });
      });

      expect(result.current.routerState.stack).toHaveLength(2);
      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'SEARCH',
      });
    });

    test('should handle back action', () => {
      const { result } = renderHook(() => useNativeRouter(init));

      act(() => {
        result.current.router.push({ route: 'SIGN_IN', params: undefined });
        result.current.router.back();
      });

      const route = result.current.routerState.stack[0];
      expect((route as BasicRoute).state.route).toBe('HOME');
    });

    test('should handle back action with tabs', () => {
      const { result } = renderHook(() =>
        useNativeRouter({
          id: 'test',
          stack: [
            {
              id: 'MAIN_TABS',
              tabs: [
                { id: 'HOME', route: 'HOME' },
                { id: 'SEARCH', route: 'SEARCH' },
              ],
              currentIndex: 0,
            },
          ],
        }),
      );

      act(() => {
        result.current.router.push({ route: 'SEARCH', params: undefined });
        result.current.router.push({ route: 'HOME', params: undefined });
      });
      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'HOME',
      });

      let backResult: boolean | undefined;
      act(() => {
        backResult = result.current.router.back();
      });
      expect(backResult).toBe(true);
      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'SEARCH',
      });

      act(() => {
        backResult = result.current.router.back();
      });
      expect(backResult).toBe(true);
      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'HOME',
      });

      act(() => {
        backResult = result.current.router.back();
      });
      expect(backResult).toBe(false);
      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'HOME',
      });
    });

    test('should handle pop action', () => {
      const { result } = renderHook(() => useNativeRouter(init));

      act(() => {
        result.current.router.push({ route: 'SIGN_IN', params: undefined });
        result.current.router.push({ route: 'SIGN_UP', params: undefined });
        result.current.router.pop(2);
      });

      expect(result.current.routerState.stack).toHaveLength(1);
      const route = result.current.routerState.stack[0];
      expect((route as BasicRoute).state.route).toBe('HOME');
    });

    test('should handle replace action', () => {
      const { result } = renderHook(() => useNativeRouter(init));

      act(() => {
        result.current.router.push({ route: 'SIGN_IN', params: undefined });
        result.current.router.replace({ route: 'SIGN_UP', params: undefined });
      });

      expect(result.current.routerState.stack).toHaveLength(2);
      const route = result.current.routerState.stack[1];
      expect((route as BasicRoute).state.route).toBe('SIGN_UP');
    });

    test('should handle replace action with tabs', () => {
      const { result } = renderHook(() =>
        useNativeRouter({
          id: 'test',
          stack: [
            {
              id: 'MAIN_TABS',
              tabs: [
                { id: 'HOME', route: 'HOME' },
                { id: 'SEARCH', route: 'SEARCH' },
              ],
              currentIndex: 0,
            },
          ],
        }),
      );

      act(() => {
        result.current.router.push({ route: 'SEARCH', params: undefined });
        result.current.router.replace({ route: 'HOME', params: undefined });
      });

      expect(result.current.routerState.stack).toHaveLength(1);
      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'HOME',
      });
    });

    test('should handle backToTop action', () => {
      const { result } = renderHook(() => useNativeRouter(init));

      act(() => {
        result.current.router.push({ route: 'SIGN_IN', params: undefined });
        result.current.router.push({ route: 'SIGN_UP', params: undefined });
        result.current.router.push({ route: 'ABOUT', params: undefined });
        result.current.router.backToTop();
      });

      expect(result.current.routerState.stack).toHaveLength(1);
      const route = result.current.routerState.stack[0];
      expect((route as BasicRoute).state.route).toBe('HOME');
    });

    test('should handle showModal action', async () => {
      const { result } = renderHook(() => useNativeRouter(init));

      await act(async () => {
        await result.current.router.showModal(
          { id: 'modal1', animationType: 'fade', gestureEnabled: true },
          <div>Modal Content</div>,
        );
      });

      expect(result.current.routerState.modals).toHaveLength(1);
      expect(result.current.routerState.modals[0].id).toBe('modal1');
    });

    test('should handle updateModal action', async () => {
      const { result } = renderHook(() => useNativeRouter(init));

      await act(async () => {
        await result.current.router.showModal(
          { id: 'modal1', animationType: 'fade', gestureEnabled: true },
          <div>Old Content</div>,
        );
        result.current.router.updateModal('modal1', {
          content: <div>New Content</div>,
          gestureEnabled: false,
          animationType: 'slide',
        });
      });

      expect(result.current.routerState.modals).toHaveLength(1);
      expect(result.current.routerState.modals[0].children).toEqual(
        <div>New Content</div>,
      );
      expect(result.current.routerState.modals[0].gestureEnabled).toBe(false);
      expect(result.current.routerState.modals[0].animationType).toBe('slide');
    });

    test('should handle hideModal action', async () => {
      const { result } = renderHook(() => useNativeRouter(init));

      await act(async () => {
        await result.current.router.showModal(
          { id: 'modal1', animationType: 'fade', gestureEnabled: true },
          <div>Modal Content</div>,
        );
        result.current.router.hideModal('modal1');
      });

      expect(result.current.routerState.modals).toHaveLength(0);
    });

    test('should handle __screenDismissed action', () => {
      const { result } = renderHook(() => useNativeRouter(init));

      act(() => {
        result.current.router.__screenDismissed('HOME');
      });

      expect(result.current.routerState.stack).toHaveLength(1);

      act(() => {
        result.current.router.push({
          id: 'siginin',
          route: 'SIGN_IN',
          params: undefined,
        });
        result.current.router.__screenDismissed('siginin');
      });

      expect(result.current.routerState.stack).toHaveLength(1);
      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'HOME',
      });
    });

    test('should handle __screenDismissed action with modal', async () => {
      const { result } = renderHook(() => useNativeRouter(init));

      await act(async () => {
        await result.current.router.showModal(
          { id: 'modal1', animationType: 'fade', gestureEnabled: true },
          <div>Modal Content</div>,
        );
        result.current.router.__screenDismissed('modal1');
      });

      expect(result.current.routerState.modals).toHaveLength(0);
    });
  });

  describe('listeners', () => {
    test('should handle addRouteWillChangeListener', () => {
      const { result } = renderHook(() => useNativeRouter(init));
      const listener = jest.fn();

      act(() => {
        result.current.router.addRouteWillChangeListener(listener);
        result.current.router.push({ route: 'SIGN_IN', params: undefined });
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ route: 'SIGN_IN' }),
      );
    });

    test('should handle addRouteDidChangeListener', () => {
      const { result } = renderHook(() => useNativeRouter(init));
      const listener = jest.fn();

      act(() => {
        result.current.router.addRouteDidChangeListener(listener);
        result.current.router.push({ route: 'SIGN_IN', params: undefined });
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ route: 'SIGN_IN' }),
      );
    });

    test('should handle addScreenWillBePushedListener', () => {
      const { result } = renderHook(() => useNativeRouter(init));
      const listener = jest.fn();

      act(() => {
        result.current.router.addScreenWillBePushedListener(listener);
        result.current.router.push({
          id: 'signin',
          route: 'SIGN_IN',
          params: undefined,
        });
      });

      expect(listener).toHaveBeenCalledWith([
        {
          id: 'signin',
          route: { route: 'SIGN_IN', params: undefined },
        },
      ]);
    });

    test('should handle addScreenWillBeRemovedListener', () => {
      const { result } = renderHook(() => useNativeRouter(init));
      const listener = jest.fn();

      act(() => {
        result.current.router.push({
          id: 'signin',
          route: 'SIGN_IN',
          params: undefined,
        });
        result.current.router.addScreenWillBeRemovedListener(listener);
        result.current.router.back();
      });

      expect(listener).toHaveBeenCalledWith([
        {
          id: 'signin',
          route: { route: 'SIGN_IN', params: undefined },
        },
      ]);
    });

    test('should handle screen listeners in replace all action', () => {
      const { result } = renderHook(() =>
        useNativeRouter({
          id: 'test',
          stack: [
            {
              id: 'MAIN_TABS',
              lazy: true,
              tabs: [
                {
                  stack: [
                    { id: 'HOME', route: 'HOME' },
                    {
                      id: 'USER_2',
                      route: 'WEBCARD',
                      params: { userName: 'user-2' },
                    },
                  ],
                },
                { id: 'SEARCH', route: 'SEARCH' },
              ],
              currentIndex: 0,
            },
            { id: 'NEW_POST', route: 'NEW_POST' },
          ],
        }),
      );
      const screenWillBeRemovedListener = jest.fn();
      const screenWillBePushedListener = jest.fn();

      act(() => {
        result.current.router.addScreenWillBeRemovedListener(
          screenWillBeRemovedListener,
        );
        result.current.router.addScreenWillBePushedListener(
          screenWillBePushedListener,
        );
        result.current.router.replaceAll({
          id: 'test',
          stack: [
            {
              id: 'MAIN_TABS',
              lazy: false,
              tabs: [
                {
                  stack: [
                    { id: 'SIGN_IN', route: 'SIGN_IN' },
                    {
                      id: 'SIGN_UP',
                      route: 'SIGN_UP',
                    },
                  ],
                },
                { id: 'HOME', route: 'HOME' },
              ],
              currentIndex: 1,
            },
            {
              id: 'USER_2_BIS',
              route: 'WEBCARD',
              params: { userName: 'user-2' },
            },
          ],
        });
      });

      expect(screenWillBeRemovedListener.mock.calls).toMatchInlineSnapshot(`
        [
          [
            [
              {
                "id": "NEW_POST",
                "route": {
                  "route": "NEW_POST",
                },
              },
              {
                "id": "USER_2",
                "route": {
                  "params": {
                    "userName": "user-2",
                  },
                  "route": "WEBCARD",
                },
              },
            ],
          ],
        ]
      `);

      expect(screenWillBePushedListener.mock.calls).toMatchInlineSnapshot(`
        [
          [
            [
              {
                "id": "USER_2_BIS",
                "route": {
                  "params": {
                    "userName": "user-2",
                  },
                  "route": "WEBCARD",
                },
              },
              {
                "id": "SIGN_UP",
                "route": {
                  "route": "SIGN_UP",
                },
              },
              {
                "id": "SIGN_IN",
                "route": {
                  "route": "SIGN_IN",
                },
              },
            ],
          ],
        ]
      `);
    });

    test('should handle addModalCloseRequestListener', async () => {
      const { result } = renderHook(() => useNativeRouter(init));
      await act(async () => {
        await result.current.router.showModal(
          { id: 'modal1', animationType: 'fade', gestureEnabled: true },
          <div>Modal Content</div>,
        );
      });

      const listener = jest.fn().mockReturnValue(false);
      result.current.router.addModalCloseRequestListener(listener);

      act(() => {
        result.current.router.__screenDismissed('modal1');
      });

      expect(listener).toHaveBeenCalledWith('modal1');
      expect(result.current.routerState.modals).toHaveLength(0);

      await act(async () => {
        await result.current.router.showModal(
          { id: 'modal2', animationType: 'fade', gestureEnabled: true },
          <div>Modal Content</div>,
        );
      });
      listener.mockReturnValue(true);

      act(() => {
        result.current.router.__screenDismissed('modal2');
      });
      expect(result.current.routerState.modals).toHaveLength(1);
    });

    test('should handle modal interceptors', async () => {
      const { result } = renderHook(() => useNativeRouter(init));
      let deferred: Deferred<undefined> | undefined;
      const interceptor = jest.fn(() => {
        deferred = createDeferred();
        return deferred.promise;
      });

      result.current.router.addModalInterceptor(interceptor);

      act(() => {
        result.current.router.showModal(
          { id: 'modal1', animationType: 'fade', gestureEnabled: true },
          <div>Modal Content</div>,
        );
      });

      expect(interceptor).toHaveBeenCalled();
      expect(result.current.routerState.modals).toHaveLength(0);

      await act(async () => {
        deferred?.resolve(undefined);
        await deferred?.promise;
      });
      expect(result.current.routerState.modals).toHaveLength(1);
    });
  });

  describe('back button', () => {
    test('should handle BackHandler event', async () => {
      let listener: () => boolean = () => false;
      (BackHandler.addEventListener as jest.Mock).mockImplementationOnce(
        (_, callback) => {
          listener = callback;
        },
      );

      const { result } = renderHook(() => useNativeRouter(init));

      let listenerResult: boolean | undefined;
      act(() => {
        result.current.router.push({ route: 'SIGN_IN', params: undefined });
        listenerResult = listener();
      });
      expect(listenerResult).toBe(true);
      expect(result.current.routerState.stack).toHaveLength(1);
      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'HOME',
      });

      act(() => {
        listenerResult = listener();
      });
      expect(listenerResult).toBe(false);
      expect(result.current.routerState.stack).toHaveLength(1);
      expect(result.current.router.getCurrentRoute()).toEqual({
        route: 'HOME',
      });

      await act(async () => {
        await result.current.router.showModal(
          { id: 'modal1', animationType: 'fade', gestureEnabled: true },
          <div>Modal Content</div>,
        );
      });
      expect(result.current.routerState.modals).toHaveLength(1);

      act(() => {
        listenerResult = listener();
      });
      expect(listenerResult).toBe(true);
      expect(result.current.routerState.modals).toHaveLength(0);

      await act(async () => {
        await result.current.router.showModal(
          { id: 'modal1', animationType: 'fade', gestureEnabled: true },
          <div>Modal Content</div>,
        );
      });
      expect(result.current.routerState.modals).toHaveLength(1);
      result.current.router.addModalCloseRequestListener(() => true);

      act(() => {
        listenerResult = listener();
      });
      expect(listenerResult).toBe(true);
      expect(result.current.routerState.modals).toHaveLength(1);
    });
  });
});
