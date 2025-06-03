import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQuery, useRelayEnvironment } from 'react-relay';
import type { GraphQLTaggedNode } from 'react-relay';
import type { OperationType, Subscription } from 'relay-runtime';

const useRefetch = <T extends OperationType>({
  query,
  variables,
}: {
  query: GraphQLTaggedNode;
  variables: T['variables'];
}) => {
  const environment = useRelayEnvironment();
  const [refreshing, setRefreshing] = useState(false);
  const currentSubscription = useRef<Subscription>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    currentSubscription.current = fetchQuery(environment, query, variables, {
      fetchPolicy: 'network-only',
    }).subscribe({
      complete: () => {
        setRefreshing(false);
      },
      error: () => {
        setRefreshing(false);
      },
    });
  }, [environment, query, variables]);

  useEffect(() => {
    return currentSubscription.current?.unsubscribe();
  }, []);

  return { refreshing, onRefresh };
};
export default useRefetch;
