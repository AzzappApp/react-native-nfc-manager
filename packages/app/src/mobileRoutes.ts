import type { RouterInit } from '#components/NativeRouter';

/**
 * Main stack of the app
 */
export const mainRoutes = (withOnboarding: boolean): RouterInit => {
  const stack: RouterInit['stack'] = [];

  if (withOnboarding) {
    stack.push({
      id: 'ONBOARDING',
      route: 'ONBOARDING',
    });
  } else {
    stack.push({
      id: 'MAIN_TAB',
      currentIndex: 0,
      lazy: true,
      tabs: [
        {
          id: 'HOME',
          route: 'HOME',
        },
        {
          id: 'CONTACTS',
          route: 'CONTACTS',
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
export const signInRoutes: RouterInit = {
  id: 'SIGN_IN_STACK',
  stack: [{ id: 'SIGN_IN', route: 'SIGN_IN' }],
};

/**
 * Sign up stack
 */
export const signUpRoutes: RouterInit = {
  id: 'SIGN_UP_STACK',
  stack: [{ id: 'SIGN_UP', route: 'SIGN_UP' }],
};
