import { useCallback, useMemo, useRef } from 'react';
import { useMutation, useRelayEnvironment } from 'react-relay';
import { applyOptimisticMutation } from 'relay-runtime';
import type { GraphQLTaggedNode, UseMutationConfig } from 'react-relay';
import type { Disposable, MutationParameters } from 'relay-runtime';

const useFormMutation = <Mutation extends MutationParameters>(
  mutation: GraphQLTaggedNode,
) => {
  const disposableRef = useRef<Disposable>();
  const [commitMutation] = useMutation<Mutation>(mutation);
  const environment = useRelayEnvironment();

  const applyOptimistic = useCallback(
    (optimisticResponse: object) => {
      const previousDisposable = disposableRef.current;
      disposableRef.current = applyOptimisticMutation(environment, {
        mutation,
        variables: {},
        optimisticResponse,
      });
      previousDisposable?.dispose();
    },
    [environment, mutation],
  );

  const revert = useCallback(() => {
    disposableRef.current?.dispose();
  }, []);

  const commit = useCallback(
    (config: UseMutationConfig<Mutation>) =>
      commitMutation({
        ...config,
        onCompleted(...args) {
          revert();
          config.onCompleted?.(...args);
        },
      }),
    [commitMutation, revert],
  );

  return useMemo(
    () => ({ commit, applyOptimistic, revert }),
    [commit, applyOptimistic, revert],
  );
};

export default useFormMutation;
