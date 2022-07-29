import { Suspense, useEffect } from 'react';
import { loadQueryFor, useQueryLoaderQuery } from './QueryLoader';
import type { LoadQueryOptions } from './QueryLoader';
import type { ComponentType } from 'react';
import type { PreloadedQuery } from 'react-relay';

type RelayScreenOptions<U> = LoadQueryOptions<U> & {
  fallback?: React.ComponentType<any> | null;
};

function relayScreen<
  T extends { preloadedQuery: PreloadedQuery<any> },
  U extends T extends { params: infer V } ? V : any,
>(
  Component: ComponentType<T>,
  { fallback: Fallback, ...options }: RelayScreenOptions<U>,
): ComponentType<Omit<T, 'preloadedQuery'>> & typeof options {
  const RelayWrapper = (props: T) => {
    const { screenId, route, params } = props as any;
    const preloadedQuery = useQueryLoaderQuery((props as any).screenId)!;
    useEffect(() => {
      if (!preloadedQuery) {
        loadQueryFor(screenId, options, params);
      }
    }, [screenId, params, preloadedQuery, route]);
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

export const isRelayScreen = (
  Component: any,
): Component is LoadQueryOptions<any> => {
  const type = typeof Component?.query;
  return type === 'string' || type === 'function';
};
