import { act, renderHook } from '@testing-library/react-native';
import { useNativeRouter } from '../NativeRouter';

jest.mock('#helpers/idHelpers', () => ({ createId: () => `created-id` }));

describe('NativeRouter', () => {
  describe('useNativeRouter', () => {
    test('should return initial state from config', () => {
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
                      route: 'PROFILE',
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
          modals: [{ id: 'CHAT', route: 'NEW_POST' }],
        });
      });

      expect(result.current.routerState).toMatchInlineSnapshot(`
        {
          "modals": [
            {
              "id": "CHAT",
              "kind": "route",
              "state": {
                "route": "NEW_POST",
              },
            },
          ],
          "stack": [
            {
              "id": "MAIN_TABS",
              "kind": "tabs",
              "state": {
                "currentIndex": 1,
                "tabs": [
                  {
                    "id": "created-id",
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
                          "route": "PROFILE",
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
                        route: 'PROFILE',
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
            modals: [{ id: 'CHAT', route: 'NEW_POST' }],
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
                        route: 'PROFILE',
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

      test('should return the top level stack route if any', () => {
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
                        route: 'PROFILE',
                        params: { userName: 'user-2' },
                      },
                    ],
                  },
                  { id: 'SEARCH', route: 'SEARCH' },
                ],
                currentIndex: 0,
              },
            ],
          });
        });

        expect(result.current.router.getCurrentRoute()).toEqual({
          route: 'PROFILE',
          params: { userName: 'user-2' },
        });
      });
    });

    describe('router.push', () => {
      test('should add route to the current stack', () => {
        let { result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 0,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    stack: [
                      {
                        id: 'SEARCH',
                        route: 'SEARCH',
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });

        act(() => {
          result.current.router.push({
            route: 'PROFILE',
            params: { userName: 'user-0' },
          });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 0,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
              {
                "id": "created-id",
                "kind": "route",
                "state": {
                  "params": {
                    "userName": "user-0",
                  },
                  "route": "PROFILE",
                },
              },
            ],
          }
        `);

        unmount();
        ({ result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 1,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    stack: [
                      {
                        id: 'SEARCH',
                        route: 'SEARCH',
                      },
                    ],
                  },
                ],
              },
            ],
          });
        }));

        act(() => {
          result.current.router.push({
            route: 'PROFILE',
            params: { userName: 'user-0' },
          });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                        {
                          "id": "created-id",
                          "kind": "route",
                          "state": {
                            "params": {
                              "userName": "user-0",
                            },
                            "route": "PROFILE",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          }
        `);
      });

      test('should set current tab if tabs exist', () => {
        let { result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 1,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    stack: [
                      {
                        id: 'SEARCH',
                        route: 'SEARCH',
                      },
                    ],
                  },
                  {
                    id: 'FOLLOWINGS',
                    route: 'FOLLOWINGS',
                  },
                ],
              },
            ],
          });
        });

        act(() => {
          result.current.router.push({ route: 'FOLLOWINGS' });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 2,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                      ],
                    },
                    {
                      "id": "FOLLOWINGS",
                      "kind": "route",
                      "state": {
                        "route": "FOLLOWINGS",
                      },
                    },
                  ],
                },
              },
            ],
          }
        `);

        unmount();
        ({ result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 1,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    id: 'FOLLOWINGS',
                    route: 'FOLLOWINGS',
                  },
                ],
              },
              {
                id: 'SEARCH',
                route: 'SEARCH',
              },
            ],
          });
        }));

        act(() => {
          result.current.router.push({ route: 'FOLLOWINGS' });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "FOLLOWINGS",
                      "kind": "route",
                      "state": {
                        "route": "FOLLOWINGS",
                      },
                    },
                  ],
                },
              },
              {
                "id": "SEARCH",
                "kind": "route",
                "state": {
                  "route": "SEARCH",
                },
              },
              {
                "id": "created-id",
                "kind": "route",
                "state": {
                  "route": "FOLLOWINGS",
                },
              },
            ],
          }
        `);
      });

      test('should push to modal if there is a modal', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'HOME',
                route: 'HOME',
              },
            ],
            modals: [
              {
                id: 'SIGN_IN',
                route: 'SIGN_IN',
              },
            ],
          });
        });

        act(() => {
          result.current.router.push({
            route: 'PROFILE',
            params: { userName: 'user-0' },
          });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [
              {
                "id": "SIGN_IN",
                "kind": "route",
                "state": {
                  "route": "SIGN_IN",
                },
              },
              {
                "id": "created-id",
                "kind": "route",
                "state": {
                  "params": {
                    "userName": "user-0",
                  },
                  "route": "PROFILE",
                },
              },
            ],
            "stack": [
              {
                "id": "HOME",
                "kind": "route",
                "state": {
                  "route": "HOME",
                },
              },
            ],
          }
        `);
      });
    });

    describe('router.back', () => {
      test('should pop route from the current stack', () => {
        let { result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 1,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    stack: [
                      {
                        id: 'SEARCH',
                        route: 'SEARCH',
                      },
                      {
                        id: 'user-1',
                        route: 'PROFILE',
                        params: { userName: 'user1' },
                      },
                    ],
                  },
                ],
              },
              {
                id: 'user-0',
                route: 'PROFILE',
                params: { userName: 'user-0' },
              },
            ],
          });
        });

        act(() => {
          result.current.router.back();
        });
        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                        {
                          "id": "user-1",
                          "kind": "route",
                          "state": {
                            "params": {
                              "userName": "user1",
                            },
                            "route": "PROFILE",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          }
        `);

        act(() => {
          result.current.router.back();
        });
        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          }
        `);

        unmount();
        ({ result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'user-0',
                route: 'PROFILE',
                params: { userName: 'user-0' },
              },
              {
                id: 'MAIN_TAB',
                currentIndex: 1,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    stack: [
                      {
                        id: 'SEARCH',
                        route: 'SEARCH',
                      },
                    ],
                  },
                ],
              },
            ],
          });
        }));
        act(() => {
          result.current.router.back();
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "user-0",
                "kind": "route",
                "state": {
                  "params": {
                    "userName": "user-0",
                  },
                  "route": "PROFILE",
                },
              },
            ],
          }
        `);
      });

      test('should pop the if there is a modal', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'HOME',
                route: 'HOME',
              },
              {
                id: 'CHAT',
                route: 'NEW_POST',
              },
            ],
            modals: [
              {
                id: 'SIGN_IN',
                route: 'SIGN_IN',
              },
              {
                id: 'FOLLOWINGS',
                route: 'FOLLOWINGS',
              },
            ],
          });
        });

        act(() => {
          result.current.router.back();
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [
              {
                "id": "SIGN_IN",
                "kind": "route",
                "state": {
                  "route": "SIGN_IN",
                },
              },
            ],
            "stack": [
              {
                "id": "HOME",
                "kind": "route",
                "state": {
                  "route": "HOME",
                },
              },
              {
                "id": "CHAT",
                "kind": "route",
                "state": {
                  "route": "NEW_POST",
                },
              },
            ],
          }
        `);

        act(() => {
          result.current.router.back();
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "HOME",
                "kind": "route",
                "state": {
                  "route": "HOME",
                },
              },
              {
                "id": "CHAT",
                "kind": "route",
                "state": {
                  "route": "NEW_POST",
                },
              },
            ],
          }
        `);
      });
    });

    describe('router.replace', () => {
      test('should replace route from the current stack', () => {
        let { result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 0,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    stack: [
                      {
                        id: 'SEARCH',
                        route: 'SEARCH',
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });

        act(() => {
          result.current.router.replace({
            route: 'PROFILE',
            params: { userName: 'user-0' },
          });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "created-id",
                "kind": "route",
                "state": {
                  "params": {
                    "userName": "user-0",
                  },
                  "route": "PROFILE",
                },
              },
            ],
          }
        `);

        unmount();
        ({ result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 1,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    stack: [
                      {
                        id: 'SEARCH',
                        route: 'SEARCH',
                      },
                    ],
                  },
                ],
              },
            ],
          });
        }));

        act(() => {
          result.current.router.replace({
            route: 'PROFILE',
            params: { userName: 'user-0' },
          });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "created-id",
                          "kind": "route",
                          "state": {
                            "params": {
                              "userName": "user-0",
                            },
                            "route": "PROFILE",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          }
        `);
      });

      test('should set current tab if tabs exist', () => {
        let { result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 1,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    stack: [
                      {
                        id: 'SEARCH',
                        route: 'SEARCH',
                      },
                    ],
                  },
                  {
                    id: 'FOLLOWINGS',
                    route: 'FOLLOWINGS',
                  },
                ],
              },
            ],
          });
        });

        act(() => {
          result.current.router.replace({ route: 'FOLLOWINGS' });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 2,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                      ],
                    },
                    {
                      "id": "FOLLOWINGS",
                      "kind": "route",
                      "state": {
                        "route": "FOLLOWINGS",
                      },
                    },
                  ],
                },
              },
            ],
          }
        `);

        unmount();
        ({ result, unmount } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 1,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    id: 'FOLLOWINGS',
                    route: 'FOLLOWINGS',
                  },
                ],
              },
              {
                id: 'SEARCH',
                route: 'SEARCH',
              },
            ],
          });
        }));

        act(() => {
          result.current.router.replace({ route: 'FOLLOWINGS' });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "FOLLOWINGS",
                      "kind": "route",
                      "state": {
                        "route": "FOLLOWINGS",
                      },
                    },
                  ],
                },
              },
              {
                "id": "created-id",
                "kind": "route",
                "state": {
                  "route": "FOLLOWINGS",
                },
              },
            ],
          }
        `);
      });

      test('should replace the modal if there is a modal', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'HOME',
                route: 'HOME',
              },
            ],
            modals: [
              {
                id: 'SIGN_IN',
                route: 'SIGN_IN',
              },
            ],
          });
        });

        act(() => {
          result.current.router.replace({
            route: 'PROFILE',
            params: { userName: 'user-0' },
          });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [
              {
                "id": "created-id",
                "kind": "route",
                "state": {
                  "params": {
                    "userName": "user-0",
                  },
                  "route": "PROFILE",
                },
              },
            ],
            "stack": [
              {
                "id": "HOME",
                "kind": "route",
                "state": {
                  "route": "HOME",
                },
              },
            ],
          }
        `);
      });
    });

    describe('router.showModal', () => {
      test('should push a modal', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'HOME',
                route: 'HOME',
              },
            ],
            modals: [],
          });
        });
        act(() => {
          result.current.router.showModal({ route: 'FOLLOWINGS' });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [
              {
                "id": "created-id",
                "kind": "route",
                "state": {
                  "route": "FOLLOWINGS",
                },
              },
            ],
            "stack": [
              {
                "id": "HOME",
                "kind": "route",
                "state": {
                  "route": "HOME",
                },
              },
            ],
          }
        `);
      });

      test('should push to the modal stack if there is already a modal', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'HOME',
                route: 'HOME',
              },
            ],
            modals: [
              {
                id: 'CHAT',
                route: 'NEW_POST',
              },
            ],
          });
        });
        act(() => {
          result.current.router.showModal({ route: 'FOLLOWINGS' });
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [
              {
                "id": "CHAT",
                "kind": "route",
                "state": {
                  "route": "NEW_POST",
                },
              },
              {
                "id": "created-id",
                "kind": "route",
                "state": {
                  "route": "FOLLOWINGS",
                },
              },
            ],
            "stack": [
              {
                "id": "HOME",
                "kind": "route",
                "state": {
                  "route": "HOME",
                },
              },
            ],
          }
        `);
      });
    });

    describe('screenDismissed', () => {
      test('should remove the screen from the current stack', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'MAIN_TAB',
                currentIndex: 1,
                tabs: [
                  {
                    id: 'HOME',
                    route: 'HOME',
                  },
                  {
                    stack: [
                      {
                        id: 'SEARCH',
                        route: 'SEARCH',
                      },
                      {
                        id: 'user-1',
                        route: 'PROFILE',
                        params: { userName: 'user1' },
                      },
                      {
                        id: 'user-2',
                        route: 'PROFILE',
                        params: { userName: 'user2' },
                      },
                    ],
                  },
                ],
              },
              {
                id: 'user-0',
                route: 'PROFILE',
                params: { userName: 'user-0' },
              },
            ],
          });
        });

        act(() => {
          result.current.router.screenDismissed('user-1');
          result.current.router.screenDismissed('user-0');
        });
        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                        {
                          "id": "user-1",
                          "kind": "route",
                          "state": {
                            "params": {
                              "userName": "user1",
                            },
                            "route": "PROFILE",
                          },
                        },
                        {
                          "id": "user-2",
                          "kind": "route",
                          "state": {
                            "params": {
                              "userName": "user2",
                            },
                            "route": "PROFILE",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          }
        `);

        act(() => {
          result.current.router.screenDismissed('user-1');
        });
        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                        {
                          "id": "user-2",
                          "kind": "route",
                          "state": {
                            "params": {
                              "userName": "user2",
                            },
                            "route": "PROFILE",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          }
        `);

        act(() => {
          result.current.router.screenDismissed('user-2');
        });
        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          }
        `);

        act(() => {
          result.current.router.screenDismissed('SEARCH');
        });
        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "MAIN_TAB",
                "kind": "tabs",
                "state": {
                  "currentIndex": 1,
                  "tabs": [
                    {
                      "id": "HOME",
                      "kind": "route",
                      "state": {
                        "route": "HOME",
                      },
                    },
                    {
                      "id": "created-id",
                      "kind": "stack",
                      "state": [
                        {
                          "id": "SEARCH",
                          "kind": "route",
                          "state": {
                            "route": "SEARCH",
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          }
        `);
      });

      test('should pop the if there is a modal', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'HOME',
                route: 'HOME',
              },
              {
                id: 'CHAT',
                route: 'NEW_POST',
              },
            ],
            modals: [
              {
                id: 'SIGN_IN',
                route: 'SIGN_IN',
              },
              {
                id: 'FOLLOWINGS',
                route: 'FOLLOWINGS',
              },
            ],
          });
        });

        act(() => {
          result.current.router.back();
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [
              {
                "id": "SIGN_IN",
                "kind": "route",
                "state": {
                  "route": "SIGN_IN",
                },
              },
            ],
            "stack": [
              {
                "id": "HOME",
                "kind": "route",
                "state": {
                  "route": "HOME",
                },
              },
              {
                "id": "CHAT",
                "kind": "route",
                "state": {
                  "route": "NEW_POST",
                },
              },
            ],
          }
        `);

        act(() => {
          result.current.router.back();
        });

        expect(result.current.routerState).toMatchInlineSnapshot(`
          {
            "modals": [],
            "stack": [
              {
                "id": "HOME",
                "kind": "route",
                "state": {
                  "route": "HOME",
                },
              },
              {
                "id": "CHAT",
                "kind": "route",
                "state": {
                  "route": "NEW_POST",
                },
              },
            ],
          }
        `);
      });
    });

    /// TODO backToTop is not used for the moment in the application
    /// and is buggy we should either remove the features it not needed
    /// or properly implements it.
    describe.skip('router.backToTop', () => {
      test('should reset state', () => {
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
                        route: 'PROFILE',
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
            modals: [{ id: 'CHAT', route: 'NEW_POST' }],
          });
        });
        act(() => {
          result.current.router.backToTop();
        });
        expect(result.current.routerState).toMatchInlineSnapshot();
      });
    });

    describe('router listerners', () => {
      test('router should dispatch a screenWillBePushed and route change events when a screen is pushed', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [{ id: 'HOME', route: 'HOME' }],
            modals: [],
          });
        });
        const { router } = result.current;

        const screenWillBePushedListenerSpy = jest.fn();
        router.addScreenWillBePushedListener(screenWillBePushedListenerSpy);

        const routeWillChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeWillChangeListenerSpy);

        const routeDidChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeDidChangeListenerSpy);

        act(() => {
          router.push({ route: 'PROFILE', params: { userName: 'user-1' } });
        });

        expect(screenWillBePushedListenerSpy).toHaveBeenCalledWith({
          id: expect.any(String),
          route: { route: 'PROFILE', params: { userName: 'user-1' } },
        });

        expect(routeWillChangeListenerSpy).toHaveBeenCalledWith({
          route: 'PROFILE',
          params: { userName: 'user-1' },
        });

        expect(routeDidChangeListenerSpy).toHaveBeenCalledWith({
          route: 'PROFILE',
          params: { userName: 'user-1' },
        });
      });

      test('router should dispatch a screenWillBeRemoved and route change events when a screen is poped', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              { id: 'HOME', route: 'HOME' },
              { id: 'FOLLOWINGS', route: 'FOLLOWINGS' },
            ],
            modals: [],
          });
        });
        const { router } = result.current;

        const screenWillBeRemovedListenerSpy = jest.fn();
        router.addScreenWillBeRemovedListener(screenWillBeRemovedListenerSpy);

        const routeWillChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeWillChangeListenerSpy);

        const routeDidChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeDidChangeListenerSpy);

        act(() => {
          router.back();
        });

        expect(screenWillBeRemovedListenerSpy).toHaveBeenCalledWith({
          id: 'FOLLOWINGS',
          route: { route: 'FOLLOWINGS' },
        });

        expect(routeWillChangeListenerSpy).toHaveBeenCalledWith({
          route: 'HOME',
        });

        expect(routeDidChangeListenerSpy).toHaveBeenCalledWith({
          route: 'HOME',
        });
      });

      test('router should dispatch a screenWillBePushed, screenWillBeRemoved and route change events when a screen is replaced', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [{ id: 'HOME', route: 'HOME' }],
            modals: [],
          });
        });
        const { router } = result.current;

        const screenWillBePushedListenerSpy = jest.fn();
        router.addScreenWillBePushedListener(screenWillBePushedListenerSpy);

        const screenWillBeRemovedListenerSpy = jest.fn();
        router.addScreenWillBeRemovedListener(screenWillBeRemovedListenerSpy);

        const routeWillChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeWillChangeListenerSpy);

        const routeDidChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeDidChangeListenerSpy);

        act(() => {
          router.replace({ route: 'PROFILE', params: { userName: 'user-1' } });
        });

        expect(screenWillBePushedListenerSpy).toHaveBeenCalledWith({
          id: expect.any(String),
          route: { route: 'PROFILE', params: { userName: 'user-1' } },
        });

        expect(screenWillBeRemovedListenerSpy).toHaveBeenCalledWith({
          id: 'HOME',
          route: { route: 'HOME' },
        });

        expect(routeWillChangeListenerSpy).toHaveBeenCalledWith({
          route: 'PROFILE',
          params: { userName: 'user-1' },
        });

        expect(routeDidChangeListenerSpy).toHaveBeenCalledWith({
          route: 'PROFILE',
          params: { userName: 'user-1' },
        });
      });

      test('router should dispatch a screenWillBePushed and route change events when a modal is shown', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [{ id: 'HOME', route: 'HOME' }],
            modals: [],
          });
        });
        const { router } = result.current;

        const screenWillBePushedListenerSpy = jest.fn();
        router.addScreenWillBePushedListener(screenWillBePushedListenerSpy);

        const routeWillChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeWillChangeListenerSpy);

        const routeDidChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeDidChangeListenerSpy);

        act(() => {
          router.showModal({
            route: 'PROFILE',
            params: { userName: 'user-1' },
          });
        });

        expect(screenWillBePushedListenerSpy).toHaveBeenCalledWith({
          id: expect.any(String),
          route: { route: 'PROFILE', params: { userName: 'user-1' } },
        });

        expect(routeWillChangeListenerSpy).toHaveBeenCalledWith({
          route: 'PROFILE',
          params: { userName: 'user-1' },
        });

        expect(routeDidChangeListenerSpy).toHaveBeenCalledWith({
          route: 'PROFILE',
          params: { userName: 'user-1' },
        });
      });

      test('router should dispatch a screenWillBePushed  nd route change events when a tab is set', () => {
        const { result } = renderHook(() => {
          return useNativeRouter({
            id: 'test',
            stack: [
              {
                id: 'main-tabs',
                currentIndex: 0,
                tabs: [
                  { id: 'HOME', route: 'HOME' },
                  { id: 'FOLLOWINGS', route: 'FOLLOWINGS' },
                ],
              },
            ],
            modals: [],
          });
        });
        const { router } = result.current;

        const screenWillBePushedListenerSpy = jest.fn();
        router.addScreenWillBePushedListener(screenWillBePushedListenerSpy);

        const routeWillChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeWillChangeListenerSpy);

        const routeDidChangeListenerSpy = jest.fn();
        router.addRouteWillChangeListener(routeDidChangeListenerSpy);

        act(() => {
          router.push({ route: 'FOLLOWINGS' });
        });

        expect(screenWillBePushedListenerSpy).toHaveBeenCalledWith({
          id: expect.any(String),
          route: { route: 'FOLLOWINGS' },
        });

        expect(routeWillChangeListenerSpy).toHaveBeenCalledWith({
          route: 'FOLLOWINGS',
        });

        expect(routeDidChangeListenerSpy).toHaveBeenCalledWith({
          route: 'FOLLOWINGS',
        });
      });
    });
  });
  // TODO test renderer
});
