import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

export type ScrollPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const useScrollEnd = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);

  const [position, setPosition] = useState<ScrollPosition | null>(null);

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    setPosition({
      x: target.scrollLeft,
      y: target.scrollTop,
      width: target.scrollWidth,
      height: target.scrollHeight,
    });
  };

  useEffect(() => {
    const element = ref.current;

    element?.addEventListener('scroll', handleScroll);
    return () => element?.removeEventListener('scroll', handleScroll);
  }, []);

  return [ref, position] satisfies [
    MutableRefObject<T | null>,
    ScrollPosition | null,
  ];
};

export default useScrollEnd;
