import { useCallback, useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { Media } from '@azzapp/data';

const useSlideshow = (
  medias: Media[],
  width: number,
  height: number,
  gap: number,
) => {
  const [index, setIndex] = useState(medias.length > 2 ? 1 : 0);

  const next = useCallback(() => {
    setIndex(prevIndex =>
      prevIndex === medias.length - 1 ? 0 : prevIndex + 1,
    );
  }, [medias.length]);

  const prev = useCallback(() => {
    setIndex(prevIndex =>
      prevIndex === 0 ? medias.length - 1 : prevIndex - 1,
    );
  }, [medias.length]);

  const onNext = useDebouncedCallback(next, 200, {
    leading: true,
    maxWait: 200,
  });
  const onPrev = useDebouncedCallback(prev, 200, {
    leading: true,
    maxWait: 200,
  });

  const slides: Slide[] = useMemo(() => {
    const slides: Slide[] = [];

    const centerMediaIndex = Math.ceil(medias.length / 2);
    const indexOffset = centerMediaIndex - index;

    const positions: number[] = [];

    for (let i = 0; i < medias.length; i++) {
      let newPosition = i + indexOffset;

      if (newPosition >= medias.length) {
        newPosition = newPosition - medias.length;
      }

      if (newPosition < 0) {
        newPosition = medias.length + indexOffset + i;
      }

      positions.push(newPosition);
    }

    const mediaAtCenter =
      medias[positions.findIndex(position => position === 0)];

    const centerMediaWidth =
      height * (mediaAtCenter.height / mediaAtCenter.width);

    for (let i = 0; i < medias.length; i++) {
      const position = positions[i] - centerMediaIndex;

      let left = width / 2;

      if (position === 0) {
        left -= centerMediaWidth / 2;
      } else if (position < 0) {
        left -= centerMediaWidth / 2;

        for (let j = -1; j >= position; j--) {
          const media = medias[j + centerMediaIndex];
          const mediaWidth = height * (media.height / media.width);

          left -= mediaWidth + gap;
        }
      } else {
        left += centerMediaWidth / 2 + gap;

        for (let j = 1; j < position; j++) {
          const media = medias[j + centerMediaIndex];
          const mediaWidth = height * (media.height / media.width);

          left += mediaWidth + gap;
        }
      }

      let scale = 1;
      let opacity = 1;
      let visibility: 'hidden' | undefined;

      if (Math.abs(position) >= 2) {
        visibility = 'hidden';
        opacity = 0;
        scale = 0.4;
      } else if (Math.abs(position) >= 1) {
        opacity = 0.25;
        scale = 0.4;
      }

      slides.push({
        left,
        scale,
        opacity,
        visibility,
      });
    }

    return slides;
  }, [gap, height, index, medias, width]);

  return {
    slides,
    onNext,
    onPrev,
  };
};

type Slide = {
  left: number;
  scale: number;
  opacity: number;
  visibility?: 'hidden';
};

export default useSlideshow;
