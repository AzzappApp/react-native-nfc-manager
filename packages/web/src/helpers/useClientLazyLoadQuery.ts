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
