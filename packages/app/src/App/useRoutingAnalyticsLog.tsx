import { useEffect } from 'react';
import { analyticsLogScreenEvent } from '#helpers/analytics';
import type { NativeRouter } from '#components/NativeRouter';

const useRoutingAnalyticsLog = (router: NativeRouter) => {
  useEffect(() => {
    const disposable = router.addRouteWillChangeListener(route => {
      analyticsLogScreenEvent(route.route);
    });
    return () => {
      disposable.dispose();
    };
  }, [router]);
};

export default useRoutingAnalyticsLog;
