import { useCallback, useEffect, useRef } from 'react';

const useLatestFunction = <T extends (...args: any) => any>(callback: T): T => {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => ref.current(...(args as any)),
    [],
  ) as T;
};

export default useLatestFunction;
