'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import useContainerWidth from '#hooks/useContainerWidth';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './Parallax.css';
import type { Media } from '@azzapp/data';
import type { CSSProperties, ReactNode } from 'react';

const PARALLAX_RATIO = 0.2;

const Parallax = ({
  medias,
  children,
}: {
  medias: Media[];
  children?: (props: { mediaId: string }) => ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startPosition, setStartPosition] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [iOS, setiOS] = useState(false);
  const containerWidth = useContainerWidth(containerRef);

  useEffect(() => {
    setiOS(/iPhone|iPod/.test(navigator.userAgent));

    const handleScroll = () =>
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });

    const handleResize = () => {
      setStartPosition(containerRef.current?.offsetTop ?? 0);
      setViewportHeight(window.innerHeight); // Use innerHeight or a dynamic approach if needed
    };

    const timeout = setTimeout(handleResize, 100); // after the first render and a small delay to ensure the container is rendered

    handleScroll();
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.moduleContainer}>
      {medias.map((media, index) => {
        // Calculate the offset for this media
        const elementStartY = index * viewportHeight; // The start scroll position of this element
        const distanceFromStart = scrollY - elementStartY - startPosition;

        // Only apply parallax if the element is visible in the viewport
        const isVisible =
          scrollY >= startPosition + elementStartY - viewportHeight &&
          scrollY <= startPosition + elementStartY + viewportHeight;

        const offset = isVisible
          ? Math.round(distanceFromStart * PARALLAX_RATIO)
          : 0;

        return (
          <div key={media.id} className={styles.parallaxContainer}>
            <div className={styles.parallaxLayer}>
              <ParallaxItemMemo
                media={media}
                offset={iOS ? 0 : offset}
                containerWidth={containerWidth}
              />

              {children?.({ mediaId: media.id })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ParallaxItem = ({
  imageStyle,
  media,
  offset,
  containerWidth,
}: {
  imageStyle?: CSSProperties;
  media: Media;
  offset: number;
  containerWidth?: number;
}) => {
  const style = useMemo(() => {
    return {
      transform: offset ? `translate3d(0, ${-offset}px, 0)` : 'none',
      width: containerWidth,
    } as const;
  }, [containerWidth, offset]);

  const mediaStyle = useMemo(() => {
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover', // Ensures the image covers the container
      objectPosition: 'center', // Center the content
      touchAction: 'none' /* Prevents zoom gestures */,
      pointerEvents: 'none' /* Disables pointer interaction */,
      ...imageStyle,
    } as const;
  }, [imageStyle]);

  return (
    <div key={media.id} className={styles.parallaxItem} style={style}>
      {media.kind === 'video' ? (
        <CloudinaryVideo
          assetKind="module"
          media={media}
          alt="cover"
          fluid
          style={mediaStyle}
          playsInline
          autoPlay
          muted
          loop
        />
      ) : (
        <CloudinaryImage
          mediaId={media.id}
          draggable={false}
          alt="parallax"
          fill
          sizes="100vw"
          format="auto"
          quality="auto:best"
          style={mediaStyle}
          loading="eager"
        />
      )}
    </div>
  );
};

const ParallaxItemMemo = memo(ParallaxItem);

export default Parallax;
