import isEqual from 'lodash/isEqual';
import { useRef } from 'react';

const useIsEqualMemo = <T>(factory: () => T, deps: any[]) => {
  const ref = useRef<T>(factory());
  const precedentDeps = useRef<any[]>(deps);

  if (!isEqual(deps, precedentDeps.current)) {
    ref.current = factory();
    precedentDeps.current = deps;
  }

  return ref.current;
};

export default useIsEqualMemo;
