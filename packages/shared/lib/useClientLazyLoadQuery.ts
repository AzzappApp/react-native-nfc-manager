/* eslint-disable react-hooks/rules-of-hooks */
import getRuntimeEnvironment from '@azzapp/shared/lib/getRuntimeEnvironment';
import { useLazyLoadQuery } from 'react-relay';
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
  const data = useLazyLoadQuery<TQuery>(gqlQuery, variables, {
    fetchPolicy:
      getRuntimeEnvironment() === 'node' ? 'store-only' : 'store-or-network',
    ...options,
  });

  return data;
}

export default useClientLazyLoadQuery;
