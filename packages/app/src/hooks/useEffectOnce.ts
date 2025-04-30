import { useEffect, useRef } from 'react';
import type { EffectCallback } from 'react';

const useEffectOnce = (effect: EffectCallback) => {
  const effectRef = useRef(effect);
  const hasRun = useRef(false);

  useEffect(() => {
    let cleanUp: (() => void) | undefined = undefined;
    if (!hasRun.current) {
      cleanUp = effectRef.current() ?? undefined;
      hasRun.current = true;
    }
    return () => {
      if (cleanUp) {
        cleanUp();
      }
    };
  }, []);
};
export default useEffectOnce;
