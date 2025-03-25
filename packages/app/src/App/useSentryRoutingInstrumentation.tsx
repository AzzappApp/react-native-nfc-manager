import * as Sentry from '@sentry/react-native';

import { useEffect } from 'react';
import type { NativeRouter } from '#components/NativeRouter';

const useSentryRoutingInstrumentation = (router: NativeRouter) => {
  useEffect(() => {
    const disposable = router.addRouteWillChangeListener(route => {
      Sentry.startIdleNavigationSpan({
        name: route.route,
        op: 'navigation',
      });
      Sentry.addBreadcrumb({
        category: 'navigation',
        type: 'navigation',
        message: `Navigating to ${route.route}`,
        data: {
          to: route.route,
          params: route.params,
        },
      });
    });
    return () => {
      disposable.dispose();
    };
  }, [router]);
};

export default useSentryRoutingInstrumentation;
