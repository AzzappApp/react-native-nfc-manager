import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ScreensRenderer,
  type NativeRouter,
  type ScreensRendererProps,
} from '#components/NativeRouter';
import * as RelayQueryManager from '#helpers/RelayQueryManager';
import { isRelayScreen } from '#helpers/relayScreen';
import {
  createScreenPrefetcher,
  ScreenPrefetcherProvider,
} from '#helpers/ScreenPrefetcher';
import type { ScreenPrefetchOptions } from '#helpers/ScreenPrefetcher';
import type { ROUTES } from '#routes';

type RelayScreensRendererProps = Omit<
  ScreensRendererProps,
  'onFinishTransitioning' | 'onScreenHasBeenDismissed'
> & {
  router: NativeRouter;
};

const RelayScreensRenderer = ({
  router,
  routerState,
  screens,
  defaultScreenOptions,
  tabs,
}: RelayScreensRendererProps) => {
  useEffect(
    () => () => {
      RelayQueryManager.resetQueries();
    },
    [],
  );

  const screenPrefetcher = useMemo(
    () =>
      createScreenPrefetcher(
        screens as Record<ROUTES, ScreenPrefetchOptions<any>>,
      ),
    [screens],
  );

  const screenIdsToDispose = useRef<string[]>([]).current;
  const disposeScreens = useCallback(() => {
    screenIdsToDispose.forEach(screen =>
      RelayQueryManager.disposeQueryFor(screen),
    );
    screenIdsToDispose.length = 0;
  }, [screenIdsToDispose]);

  useEffect(() => {
    const screenWillBePushedSubscription = router.addScreenWillBePushedListener(
      pushedScreens => {
        pushedScreens.forEach(({ id, route }) => {
          const Component = screens[route.route];
          if (isRelayScreen(Component)) {
            RelayQueryManager.loadQueryFor(id, Component, route.params);
          }
        });
      },
    );
    const screenWillBeRemovedSubscription =
      router.addScreenWillBeRemovedListener(removedScreens => {
        screenIdsToDispose.push(...removedScreens.map(screen => screen.id));
      });
    return () => {
      screenWillBePushedSubscription.dispose();
      screenWillBeRemovedSubscription.dispose();
    };
  }, [router, screenIdsToDispose, screenPrefetcher, screens]);

  return (
    <ScreenPrefetcherProvider value={screenPrefetcher}>
      <ScreensRenderer
        routerState={routerState}
        screens={screens}
        defaultScreenOptions={defaultScreenOptions}
        onFinishTransitioning={disposeScreens}
        onScreenHasBeenDismissed={disposeScreens}
        tabs={tabs}
      />
    </ScreenPrefetcherProvider>
  );
};

export default RelayScreensRenderer;
