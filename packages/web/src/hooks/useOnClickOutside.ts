import { useRef, useEffect } from 'react';

const useOnClickOutside = <T extends HTMLElement>(
  onClickOutside: () => void,
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.addEventListener('mousedown', handleClickOutside);
  }, [onClickOutside]);

  return ref;
};

export default useOnClickOutside;
