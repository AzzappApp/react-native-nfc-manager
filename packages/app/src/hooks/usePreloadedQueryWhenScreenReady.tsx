import { useContext, useMemo } from 'react';
import { usePreloadedQuery } from 'react-relay';
import { ScreenRendererContext } from '#components/NativeRouter';
import type { PreloadedQuery } from 'react-relay';
import type {
  GraphQLTaggedNode,
  OperationType,
  RenderPolicy,
} from 'relay-runtime';

/**
 * A wrapper around `usePreloadedQuery` that will wait for the screen to be ready before
 * resolving the query if it has suspended.
 * This is useful to prevent too much rendering during the screen transition.
 *
 * @see usePreloadedQuery
 */
const usePrelodedQueryWhenScreenReady = <TQuery extends OperationType>(
  gqlQuery: GraphQLTaggedNode,
  preloadedQuery: PreloadedQuery<TQuery>,
  options?: {
    UNSTABLE_renderPolicy?: RenderPolicy | undefined;
  },
): TQuery['response'] => {
  const { navigationEventEmitter } = useContext(ScreenRendererContext);

  const wrapPromiseMemoized = useMemo(() => {
    let resultPromise: Promise<any>;
    return (promise: PromiseLike<any>) => {
      if (!resultPromise) {
        resultPromise = Promise.all([
          promise,
          new Promise<void>(resolve => {
            const timeout = setTimeout(() => {
              resolve();
            }, 1000);

            navigationEventEmitter.once('appear', () => {
              clearTimeout(timeout);
              resolve();
            });
          }),
        ]).then(([result]) => result);
      }
      return resultPromise;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let result: TQuery['response'] | undefined;
  try {
    result = usePreloadedQuery<TQuery>(gqlQuery, preloadedQuery, options);
  } catch (error) {
    if (error && typeof error === 'object' && 'then' in error) {
      throw wrapPromiseMemoized(error as PromiseLike<any>);
    } else {
      throw error;
    }
  }
  return result;
};

export default usePrelodedQueryWhenScreenReady;
