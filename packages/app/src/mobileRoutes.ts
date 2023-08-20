import type { NativeRouterInit } from '#components/NativeRouter';

/**
 * Main stack of the app
 */
export const mainRoutes: NativeRouterInit = {
  id: 'MAIN_ROUTES',
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
          id: 'MEDIA',
          route: 'MEDIA',
        },
      ],
    },
  ],
};

/**
 * Sign in stack
 */
export const signInRoutes: NativeRouterInit = {
  id: 'SIGN_IN_STACK',
  stack: [{ id: 'SIGN_IN', route: 'SIGN_IN' }],
};

/**
 * Sign up stack
 */
export const signUpRoutes: NativeRouterInit = {
  id: 'SIGN_UP_STACK',
  stack: [{ id: 'SIGN_UP', route: 'SIGN_UP' }],
};
