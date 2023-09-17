import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ReactRelayContext } from 'react-relay';
import { getFragment, getSelector, type FragmentType } from 'relay-runtime';
import type { Environment, GraphQLTaggedNode } from 'react-relay';

const useMultiActorEnvironmentPluralFragment = <TKey extends KeyType>(
  fragmentInput: GraphQLTaggedNode,
  getActorID: (value: TKey) => string,
  fragmentRefs: readonly TKey[] | null | undefined,
): ReadonlyArray<Exclude<TKey[' $data'], undefined>> | null => {
  const [, forceUpdate] = useState(0);
  const fragment = useMemo(() => getFragment(fragmentInput), [fragmentInput]);
  const context = useContext(ReactRelayContext) as any;
  const getEnvironmentForActor = context.getEnvironmentForActor as (
    actorId: string,
  ) => Environment;

  if (!getEnvironmentForActor) {
    throw new Error(
      'useMultiActorEnvironmentPluralFragment needs `getEnvironmentForActor` to be set on relay context',
    );
  }

  const getActorIDRef = useRef(getActorID);
  getActorIDRef.current = getActorID;

  const fragmentsInfos = useMemo(
    () =>
      fragmentRefs?.map(fragmentRef => {
        const selector = getSelector(fragment, fragmentRef);
        const environment = getEnvironmentForActor(
          getActorIDRef.current(fragmentRef),
        );
        const snapshot = environment.lookup(selector as any);
        return { snapshot, environment, selector };
      }),
    [fragment, fragmentRefs, getEnvironmentForActor],
  );

  useEffect(() => {
    const subscriptions = fragmentsInfos?.map(({ snapshot, environment }) =>
      environment.subscribe(snapshot, () => {
        forceUpdate(i => i + 1);
      }),
    );
    return () => {
      subscriptions?.forEach(subscription => {
        subscription.dispose();
      });
    };
  }, [fragmentsInfos]);

  return (
    fragmentsInfos?.map(
      ({ environment, selector }) =>
        environment.lookup(selector as any).data as any,
    ) ?? null
  );
};

type KeyType<TData = unknown> = Readonly<{
  ' $data'?: TData | undefined;
  ' $fragmentSpreads': FragmentType;
}>;

export default useMultiActorEnvironmentPluralFragment;
