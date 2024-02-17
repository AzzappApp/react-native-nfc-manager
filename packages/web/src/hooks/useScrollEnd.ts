/* eslint-disable react-hooks/exhaustive-deps */
import { useRef, useCallback, useEffect, type DependencyList } from 'react';

const useScrollEnd = <T extends HTMLElement>(
  onScrollEnd: () => void,
  deps: DependencyList,
) => {
  const ref = useRef<T>(null);

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;

    const bottom =
      Math.round(target.scrollHeight - target.scrollTop) ===
      Math.round(target.clientHeight);

    if (bottom) {
      onScrollEnd();
    }
  }, deps);

  useEffect(() => {
    const element = ref.current;

    element?.addEventListener('scroll', handleScroll, { passive: true });
    return () => element?.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return ref;
};

export default useScrollEnd;
