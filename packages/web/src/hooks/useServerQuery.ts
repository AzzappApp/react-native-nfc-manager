import { useMemo } from 'react';
import { useRelayEnvironment } from 'react-relay';
// @ts-expect-error no types
import useLazyLoadQueryNode from 'react-relay/lib/relay-hooks/useLazyLoadQueryNode';
// @ts-expect-error no types
import useMemoOperationDescriptor from 'react-relay/lib/relay-hooks/useMemoOperationDescriptor';
import { __internal } from 'relay-runtime';
import type { ServerQuery } from '#helpers/preloadServerQuery';
import type { OperationType, GraphQLTaggedNode } from 'relay-runtime';

const { fetchQuery } = __internal;

function useServerQuery<TQuery extends OperationType>(
  gqlQuery: GraphQLTaggedNode,
  serverQuery: ServerQuery<TQuery>,
): TQuery['response'] {
  const environment = useRelayEnvironment();
  const operation = useMemoOperationDescriptor(gqlQuery, serverQuery.variables);
  if (operation.request.node.params.id !== serverQuery.id) {
    throw Error(
      `useServerQuery(): Mismatched version for query '${operation.request.node.params.name}'`,
    );
  }

  // ugly hack to avoid commiting the payload multiple times
  useMemo(() => {
    environment.commitPayload(operation, serverQuery.response as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useLazyLoadQueryNode({
    componentDisplayName: 'useServerQuery()',
    fetchKey: null,
    fetchPolicy: 'store-only',
    fetchObservable: fetchQuery(environment, operation),
    query: operation,
    renderPolicy: null,
  });
}

export default useServerQuery;
