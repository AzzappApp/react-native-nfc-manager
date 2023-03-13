import { Suspense, useEffect } from 'react';
import { loadQueryFor, useManagedQuery } from './RelayQueryManager';
import type { NativeScreenProps } from '#components/NativeRouter';
import type { Route } from '#routes';
import type { LoadQueryOptions } from './RelayQueryManager';
import type { ComponentType } from 'react';
import type { PreloadedQuery } from 'react-relay';
import type { OperationType } from 'relay-runtime';

export type RelayScreenOptions<U> = LoadQueryOptions<U> & {
  /**
   * The fallback component to render while the query is loading.
   */
  fallback?: React.ComponentType<any> | null;
};

/**
 * The props injected in a screen component by the `relayScreen` HOC.
 */
export type RelayScreenProps<
  T extends Route,
  P extends OperationType,
> = NativeScreenProps<T> & {
  /**
   * The preloaded query.
   */
  preloadedQuery: PreloadedQuery<P>;
};

/**
 * Check if a component is a relay screen.
 * @param Component The component to check.
 * @returns True if the component is a relay screen, false otherwise.
 */
export const isRelayScreen = (
  Component: any,
): Component is RelayScreenOptions<any> => {
  const type = typeof Component?.query;
  return type === 'string' || type === 'function';
};

/**
 * A HOC to wrap a screen component with a relay query.
 * @param Component  The screen component.
 * @param param1 The Query Options.
 * @returns
 */
function relayScreen<T extends RelayScreenProps<any, any>>(
  Component: ComponentType<T>,
  { fallback: Fallback, ...options }: RelayScreenOptions<T['route']['params']>,
): ComponentType<Omit<T, 'preloadedQuery'>> & typeof options {
  const RelayWrapper = (props: T) => {
    const {
      screenId,
      route: { params },
    } = props;
    const preloadedQuery = useManagedQuery((props as any).screenId)!;
    useEffect(() => {
      if (!preloadedQuery) {
        loadQueryFor(screenId, options, params);
      }
    }, [screenId, params, preloadedQuery]);
    return (
      <Suspense fallback={Fallback ? <Fallback {...props} /> : null}>
        {preloadedQuery && (
          <Component {...props} preloadedQuery={preloadedQuery} />
        )}
      </Suspense>
    );
  };

  const displayName = Component.displayName ?? Component.name ?? 'Screen';
  RelayWrapper.displayName = `RelayWrapper(${displayName})`;
  Object.assign(RelayWrapper, Component, options);

  return RelayWrapper as any;
}

export default relayScreen;
