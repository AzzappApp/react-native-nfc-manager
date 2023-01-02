import { useEffect, useState } from 'react';
import { useLazyLoadQuery, useRelayEnvironment } from 'react-relay';
import { fetchQuery } from 'relay-runtime';
import type { GraphQLTaggedNode } from 'react-relay';
import type {
  OperationType,
  VariablesOf,
  CacheConfig,
  RenderPolicy,
} from 'relay-runtime';

/**
 * A hook with the same api thant relay [useLazyLoadQuery](https://relay.dev/docs/api-reference/use-lazy-load-query/)
 * but that will only perform a network request on client, on server it will execute the request with
 * a 'store-only' fetch policy
 *
 * @param gqlQuery
 * @param variables
 * @param options
 * @returns
 */
function useClientLazyLoadQuery<TQuery extends OperationType>(
  gqlQuery: GraphQLTaggedNode,
  variables: VariablesOf<TQuery>,
  options?: {
    fetchKey?: number | string | undefined;
    networkCacheConfig?: CacheConfig | undefined;
    UNSTABLE_renderPolicy?: RenderPolicy | undefined;
  },
) {
  const environment = useRelayEnvironment();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(true);
  useEffect(() => {
    const observable = fetchQuery(environment, gqlQuery, variables).subscribe({
      error: (error: any) => {
        setError(error);
        setLoading(false);
      },
      complete() {
        setLoading(false);
      },
    });
    return () => {
      observable.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gqlQuery, JSON.stringify(variables)]);

  const data = useLazyLoadQuery<TQuery>(gqlQuery, variables, {
    fetchPolicy: 'store-only',
    ...options,
  });

  return { error, data, loading };
}

export default useClientLazyLoadQuery;
