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
          id: 'SEARCH',
          route: 'SEARCH',
        },
        {
          id: 'CHAT',
          route: 'CHAT',
        },
        {
          id: 'ALBUMS',
          route: 'ALBUMS',
        },
        { id: 'ACCOUNT', route: 'ACCOUNT' },
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

/**
 * New profile stack, used when the user is signing up but has not completed the profile
 */
export const newProfileRoute: NativeRouterInit = {
  id: 'NEW_PROFILE_STACK',
  stack: [{ id: 'NEW_PROFILE', route: 'NEW_PROFILE' }],
};
