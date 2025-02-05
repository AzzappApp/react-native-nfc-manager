import { useEffect, useState } from 'react';
import type { MutableRefObject } from 'react';

/**
 * @param param containerRef: the container to track
 * @returns width of the container
 */
const useContainerWidth = (
  containerRef: MutableRefObject<HTMLDivElement | null>,
) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === container) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return containerWidth;
};

export default useContainerWidth;
