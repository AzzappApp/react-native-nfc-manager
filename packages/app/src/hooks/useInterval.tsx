import { useEffect, useRef } from 'react';

/**
 * A hook to run a function at a specified interval.
 *
 * @param func The function to run.
 * @param time The interval in milliseconds.
 * @param leading Whether to run the function immediately.
 */
const useInterval = (func: () => void, time: number, leading = false) => {
  const funcRef = useRef(func);
  funcRef.current = func;
  const lastPlayTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let timeoutId: any;
    if (time > 0) {
      const play = () => {
        lastPlayTimeRef.current = Date.now();
        funcRef.current();
        timeoutId = setTimeout(play, time);
      };

      if (lastPlayTimeRef.current === null && leading) {
        play();
      } else if (lastPlayTimeRef.current) {
        const ellapsedTime = Date.now() - lastPlayTimeRef.current;
        timeoutId = setTimeout(play, time - ellapsedTime);
      } else {
        timeoutId = setTimeout(play, time);
      }
    } else {
      lastPlayTimeRef.current = null;
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);
};

export default useInterval;
