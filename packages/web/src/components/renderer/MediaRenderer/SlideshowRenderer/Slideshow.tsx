'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightIcon } from '#assets';
import { useFullScreenOverlayContext } from '#components/FullscreenOverlay/FullscreenOverlayContext';
import useIsVisible from '#hooks/useIsVisible';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './Slideshow.css';
import useSlideshow from './useSlideshow';
import type { Slide } from './useSlideshow';
import type { Media } from '@azzapp/data';
import type { CSSProperties } from 'react';

type Props = {
  medias: Media[];
  style?: CSSProperties;
  square?: boolean;
  borderRadius?: number;
};

const Slideshow = ({
  medias: baseMedias,
  style,
  square,
  borderRadius = 0,
}: Props) => {
  const [size, setSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const slideshow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = slideshow.current;

    const onSlideshowSizeChange = () => {
      if (current) {
        setSize({
          width: slideshow.current.clientWidth,
          height: slideshow.current.clientHeight,
        });
      }
    };

    onSlideshowSizeChange();
    window?.addEventListener('resize', onSlideshowSizeChange);
    return () => {
      window?.removeEventListener('resize', onSlideshowSizeChange);
    };
  }, []);

  const medias = useMemo(() => {
    if (square) {
      return baseMedias.map(baseMedia => {
        const size = Math.min(baseMedia.height, baseMedia.width);

        return {
          ...baseMedia,
          height: size,
          width: size,
        };
      });
    }

    return baseMedias;
  }, [baseMedias, square]);

  const { slides, onNext, onPrev } = useSlideshow(
    medias,
    size?.width ?? 0,
    size?.height ?? 0,
    -50,
  );

  const [isAutoPlay, setAutoplay] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const appearance = useIsVisible(containerRef);

  const startAutoPlay = () => {
    setAutoplay(true);
  };

  const stopAutoPlay = () => {
    setAutoplay(false);
  };

  useEffect(() => {
    if (appearance.visible) {
      setAutoplay(true);
    } else {
      setAutoplay(false);
    }
  }, [appearance.visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlay) {
      interval = setInterval(() => {
        onNext();
      }, 1500);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAutoPlay, onNext]);

  return (
    <div ref={containerRef} className={styles.container} style={style}>
      <div ref={slideshow} className={styles.slideshow}>
        <div
          role="button"
          className={styles.arrow}
          style={{ left: 10, rotate: '180deg' }}
          onClick={onPrev}
          onTouchStart={stopAutoPlay}
          onTouchEnd={startAutoPlay}
          onMouseOver={stopAutoPlay}
          onMouseOut={startAutoPlay}
        >
          <ArrowRightIcon className={styles.arrowIcon} />
        </div>
        <div
          role="button"
          className={styles.arrow}
          style={{ right: 10 }}
          onClick={onNext}
          onTouchStart={stopAutoPlay}
          onTouchEnd={startAutoPlay}
          onMouseOver={stopAutoPlay}
          onMouseOut={startAutoPlay}
        >
          <ArrowRightIcon className={styles.arrowIcon} />
        </div>
        {size &&
          medias.map((media, i) => {
            return (
              <SlideShowItem
                key={`${media.id}_${i}`}
                media={media}
                borderRadius={borderRadius}
                slide={slides[i]}
              />
            );
          })}
      </div>
    </div>
  );
};

type SlideShowItemProps = {
  media: Media;
  borderRadius: number;
  slide: Slide;
};

const SlideShowItem = ({ media, borderRadius, slide }: SlideShowItemProps) => {
  const { setMedia } = useFullScreenOverlayContext(media);
  return (
    <div
      className={styles.media}
      style={{
        aspectRatio: media.height / media.width,
        borderRadius,
        ...slide,
      }}
      onClick={setMedia}
    >
      {media.kind === 'video' ? (
        <CloudinaryVideo
          assetKind="module"
          media={media}
          alt="cover"
          fluid
          style={{
            objectFit: 'cover',
            width: '100%',
          }}
          playsInline
          autoPlay
          muted
          loop
        />
      ) : (
        <CloudinaryImage
          mediaId={media.id}
          draggable={false}
          alt="slideshow"
          fill
          format="auto"
          quality="auto:best"
          style={{
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  );
};

export default Slideshow;
