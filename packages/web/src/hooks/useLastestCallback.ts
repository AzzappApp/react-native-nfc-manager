import { useCallback, useRef } from 'react';

function useLatestCallback<
  T extends ((...args: any[]) => any) | null | undefined,
>(func: T): T extends null | undefined ? NonNullable<T> | (() => void) : T {
  const ref = useRef<T>(func);
  ref.current = func;

  return useCallback((...args: any[]) => ref.current?.(...args), []) as any;
}

export default useLatestCallback;
