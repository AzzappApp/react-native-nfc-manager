import { cloneElement, useCallback, useContext, useEffect } from 'react';
import { ReactRelayContext } from 'react-relay';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import { useRouter } from './NativeRouter';
import type { Route } from '#routes';
import type { ReactElement } from 'react';
import type { GestureResponderEvent } from 'react-native';
import type { PressableEvent } from 'react-native-gesture-handler/lib/typescript/components/Pressable/PressableProps';
import type { Disposable } from 'react-relay';

export type LinkProps<T extends Route> = T & {
  /**
   * If true, the current screen will be replaced by the new one.
   */
  replace?: boolean;
  /**
   * If true, the Screen prefetcher will be used to prefetch the route.
   */
  prefetch?: boolean;
  /**
   * the element that will be wrapped by the link.
   * it should be a react-native pressable component.
   */
  children: ReactElement;

  /**
   * The route key that will be used to prefetch the route.
   */
  routeKey?: string;
  /**
   *  disable the navigation
   *
   * @type {boolean}
   */
  disabled?: boolean;
};

/**
 * A link component.
 * it should be given a child that is a react-native pressable component.
 * e.g.:
 * ```tsx
 * <Link route="HOME">
 *    <PressableNative>
 *      <Text>Home</Text>
 *    </PressableNative>
 * </Link>
 * ```
 */
const Link = <T extends Route>({
  route,
  params,
  replace,
  prefetch,
  children,
  routeKey,
  disabled = false,
}: LinkProps<T>) => {
  const router = useRouter();
  const prefetchScreen = usePrefetchRoute();

  const context = useContext(ReactRelayContext);
  useEffect(() => {
    let disposable: Disposable | null = null;
    if (!disabled && prefetch && context?.environment) {
      disposable = prefetchScreen(context.environment, {
        route,
        params,
      } as Route);
    }
    return () => {
      disposable?.dispose();
    };
  }, [prefetch, prefetchScreen, route, params, context, disabled]);

  const onLinkPress = useCallback(
    (event?: GestureResponderEvent | PressableEvent) => {
      if (!disabled) {
        children.props.onPress?.(event);
        if (
          // android button is currently a pressable from react-native-gesture-handler (no isDefaultPrevented)
          event &&
          'isDefaultPrevented' in event &&
          event.isDefaultPrevented()
        ) {
          return;
        }
        if (replace) {
          router.replace({ route, params } as Route);
        } else {
          router.push({ id: routeKey ?? null, route, params } as Route);
        }
      }
    },
    [children.props, disabled, params, replace, route, routeKey, router],
  );

  return cloneElement(children, {
    accessibilityRole: 'link',
    onPress: onLinkPress,
  });
};

export default Link;
