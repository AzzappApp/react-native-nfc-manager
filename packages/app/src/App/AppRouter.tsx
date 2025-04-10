import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import MainTabBar from '#components/MainTabBar';
import {
  RouterProvider,
  ScreensRenderer,
  useNativeRouter,
} from '#components/NativeRouter';
import { setAnalyticsConsent, setAnalyticsUserId } from '#helpers/analytics';
import { hasBeenSignedIn } from '#helpers/authStore';
import {
  addGlobalEventListener,
  GLOBAL_EVENT_HIGH_PRIORITY,
} from '#helpers/globalEvents';
import { useIsAuthenticated } from '#hooks/authStateHooks';
import { useDeepLink } from '#hooks/useDeepLink';
import { useShakeDetector } from '#hooks/useShakeDetector';
import AzzappLogoLoader from '#ui/AzzappLogoLoader';
import AppRelayEnvironmentProvider from './AppRelayEnvironmentProvider';
import {
  acceptTermsRoutes,
  cookieConsentsRoutes,
  mainRoutes,
  onboardIngRoutes,
  signInRoutes,
  signUpRoutes,
} from './initialRoutes';
import RelayScreensRenderer from './RelayScreensRenderer';
import screens from './screens';
import SnapshotFadeTransitionAnimator from './SnapshotFadeTransitionAnimator';
import useRoutingAnalyticsLog from './useRoutingAnalyticsLog';
import useSentryRoutingInstrumentation from './useSentryRoutingInstrumentation';
import type { AppRouterQuery } from '#relayArtifacts/AppRouterQuery.graphql';

const AppRouter = () => {
  const authenticated = useIsAuthenticated();

  const [route, setRoute] = useState<'authenticated' | 'unauthenticated'>(
    authenticated ? 'authenticated' : 'unauthenticated',
  );

  useEffect(() => {
    setRoute(authenticated ? 'authenticated' : 'unauthenticated');
  }, [authenticated]);

  useEffect(() => {
    // We need to detect sign out before the authenticated state changes
    // to avoid a flicker in transition
    addGlobalEventListener(
      'SIGN_OUT',
      async () => {
        setRoute('unauthenticated');
        await waitTime(10);
      },
      GLOBAL_EVENT_HIGH_PRIORITY,
    );
  }, []);

  return (
    <SnapshotFadeTransitionAnimator
      route={route}
      routesMap={useMemo(
        () => ({
          authenticated: (
            <AppRelayEnvironmentProvider>
              <Suspense fallback={<AzzappLogoLoader />}>
                <MainRouter />
              </Suspense>
            </AppRelayEnvironmentProvider>
          ),
          unauthenticated: <LoginRouter />,
        }),
        [],
      )}
    />
  );
};

export default memo(AppRouter);

const LoginRouter = () => {
  const { router, routerState } = useNativeRouter(
    hasBeenSignedIn() ? signInRoutes : signUpRoutes,
  );
  useSentryRoutingInstrumentation(router);
  useRoutingAnalyticsLog(router);

  return (
    <RouterProvider value={router}>
      <ScreensRenderer routerState={routerState} screens={screens} />
    </RouterProvider>
  );
};

const tabs = {
  MAIN_TAB: MainTabBar,
};

/**
 * The main application component
 */
const MainRouter = () => {
  const { currentUser } = useLazyLoadQuery<AppRouterQuery>(
    graphql`
      query AppRouterQuery {
        currentUser {
          id
          hasAcceptedLastTermsOfUse
          profiles {
            id
          }
          cookiePreferences {
            analytics
            functional
            marketing
          }
        }
      }
    `,
    {},
  );

  const hasAcceptedLastTermsOfUse = !!currentUser?.hasAcceptedLastTermsOfUse;
  const hasAcceptedCookies = !!currentUser?.cookiePreferences;
  const hasProfiles = !!currentUser?.profiles?.length;
  const initialRoutes = useMemo(() => {
    if (!hasAcceptedLastTermsOfUse) {
      return acceptTermsRoutes;
    }
    if (!hasAcceptedCookies) {
      return cookieConsentsRoutes;
    }
    if (!hasProfiles) {
      return onboardIngRoutes;
    }
    return mainRoutes;
  }, [hasAcceptedCookies, hasAcceptedLastTermsOfUse, hasProfiles]);

  const { router, routerState } = useNativeRouter(initialRoutes);

  useEffect(() => {
    if (currentUser?.id) {
      setAnalyticsUserId(currentUser.id);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.cookiePreferences) {
      setAnalyticsConsent(currentUser.cookiePreferences);
    }
  }, [currentUser?.cookiePreferences]);

  useSentryRoutingInstrumentation(router);
  useRoutingAnalyticsLog(router);
  useDeepLink(router);

  const shakeAndShareOpened = useRef(false);
  const toggleShakeShare = useCallback(() => {
    if (shakeAndShareOpened.current) {
      router.back();
    } else {
      router.push({
        route: 'SHAKE_AND_SHARE',
      });
    }
  }, [router]);

  const resetCoolDown = useShakeDetector(toggleShakeShare);

  useEffect(() => {
    router.addRouteDidChangeListener(route => {
      if (route.route === 'SHAKE_AND_SHARE') {
        shakeAndShareOpened.current = true;
      } else if (shakeAndShareOpened.current) {
        shakeAndShareOpened.current = false;
        resetCoolDown();
      }
    });
  }, [resetCoolDown, router]);

  return (
    <RouterProvider value={router}>
      <RelayScreensRenderer
        router={router}
        routerState={routerState}
        screens={screens}
        tabs={tabs}
      />
    </RouterProvider>
  );
};
