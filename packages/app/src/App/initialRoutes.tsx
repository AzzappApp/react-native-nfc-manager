import type { RouteInit, RouterInit, TabsInit } from '#components/NativeRouter';

const createRouterInit = (
  id: string,
  route: RouteInit | TabsInit,
): RouterInit => {
  return { id, stack: [route] };
};

/**
 * Main stack of the app
 */
export const mainRoutes: RouterInit = createRouterInit('MAIN', {
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
  screenOptions: {
    stackAnimation: 'fade',
    replaceAnimation: 'push',
  },
});

export const onboardIngRoutes = createRouterInit('ONBOARDING', {
  id: 'ONBOARDING',
  route: 'ONBOARDING',
});

export const acceptTermsRoutes = createRouterInit('ACCEPT_TERMS', {
  id: 'ACCEPT_TERMS',
  route: 'ACCEPT_TERMS',
});

export const cookieConsentsRoutes = createRouterInit('COOKIE_CONSENT', {
  id: 'COOKIE_CONSENT',
  route: 'COOKIE_CONSENT',
});

/**
 * Sign in stack
 */
export const signInRoutes: RouterInit = createRouterInit('SIGN_IN_STACK', {
  id: 'SIGN_IN',
  route: 'SIGN_IN',
});

/**
 * Sign up stack
 */
export const signUpRoutes: RouterInit = createRouterInit('SIGN_UP_STACK', {
  id: 'SIGN_UP',
  route: 'SIGN_UP',
});
