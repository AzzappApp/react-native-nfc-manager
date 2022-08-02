import { Suspense, useEffect } from 'react';
import { loadQueryFor, useQueryLoaderQuery } from './QueryLoader';
import type { NativeScreenProps } from '../components/NativeRouter';
import type { Route } from '../routes';
import type { LoadQueryOptions } from './QueryLoader';
import type { ComponentType } from 'react';
import type { PreloadedQuery } from 'react-relay';
import type { OperationType } from 'relay-runtime';

export type RelayScreenOptions<U> = LoadQueryOptions<U> & {
  fallback?: React.ComponentType<any> | null;
};

export type RelayScreenProps<
  T extends Route,
  P extends OperationType,
> = NativeScreenProps<T> & {
  preloadedQuery: PreloadedQuery<P>;
};

export const isRelayScreen = (
  Component: any,
): Component is RelayScreenOptions<any> => {
  const type = typeof Component?.query;
  return type === 'string' || type === 'function';
};

function relayScreen<T extends RelayScreenProps<any, any>>(
  Component: ComponentType<T>,
  { fallback: Fallback, ...options }: RelayScreenOptions<T['route']['params']>,
): ComponentType<Omit<T, 'preloadedQuery'>> & typeof options {
  const RelayWrapper = (props: T) => {
    const {
      screenId,
      route: { params },
    } = props;
    const preloadedQuery = useQueryLoaderQuery((props as any).screenId)!;
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
