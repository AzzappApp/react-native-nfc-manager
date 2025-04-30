import { useEffect, useMemo } from 'react';
import type { Media } from '@azzapp/data';
import type { RefObject } from 'react';

const useMediaCarousel = (
  carousel: RefObject<HTMLElement | null>,
  medias: Media[],
  height: number,
  gap: number,
) => {
  useEffect(() => {
    const currentCarousel = carousel.current;
    const position = { left: 0, x: 0 };

    const onMouseMove = (e: MouseEvent) => {
      currentCarousel?.scrollTo({
        left: position.left + position.x - e.clientX,
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      position.left = e.clientX;
      currentCarousel?.removeEventListener('mousemove', onMouseMove);
      currentCarousel?.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (e: MouseEvent) => {
      position.left = currentCarousel?.scrollLeft ?? 0;
      position.x = e.clientX ?? 0;

      currentCarousel?.addEventListener('mousemove', onMouseMove);
      currentCarousel?.addEventListener('mouseup', onMouseUp);
    };

    currentCarousel?.addEventListener('mousedown', onMouseDown);

    return () => {
      currentCarousel?.removeEventListener('mousedown', onMouseDown);
    };
  }, [carousel]);

  const positions = useMemo(() => {
    const widths: number[] = [];
    const positions: number[] = [];

    for (let i = 0; i < medias.length; i++) {
      const media = medias[i];
      const resizeRatio = height / media.height;
      const currentWidth = media.width * resizeRatio;
      widths.push(Math.round(currentWidth));

      const position = positions[i - 1] + widths[i - 1] + gap / 2;

      if (i === 0) {
        positions.push(0);
      } else positions.push(position);
    }

    return positions.map(position => Math.round(position));
  }, [gap, height, medias]);

  const getIndexToNextPosition = () => {
    const currentPosition = Math.round(carousel.current?.scrollLeft ?? 0);

    const indexToNextPosition = positions.findIndex(
      position => currentPosition <= position,
    );

    if (positions[indexToNextPosition] === currentPosition) {
      return indexToNextPosition + 1;
    }

    return indexToNextPosition;
  };

  return { getIndexToNextPosition, positions };
};

export default useMediaCarousel;
