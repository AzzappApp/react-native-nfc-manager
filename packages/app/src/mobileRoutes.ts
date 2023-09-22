import type { NativeRouterInit } from '#components/NativeRouter';

/**
 * Main stack of the app
 */
export const mainRoutes = (withOnboarding: boolean): NativeRouterInit => {
  const stack: NativeRouterInit['stack'] = [];

  if (withOnboarding) {
    stack.push({
      id: 'ONBOARDING',
      route: 'ONBOARDING',
    });
  } else {
    stack.push({
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
    });
  }

  return {
    id: 'MAIN_ROUTES',
    stack,
  };
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
