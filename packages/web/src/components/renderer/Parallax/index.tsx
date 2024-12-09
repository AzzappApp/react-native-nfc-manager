'use client';

import { useEffect, useRef, useState } from 'react';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './Parallax.css';
import type { Media } from '@azzapp/data';
import type { CSSProperties, ReactNode } from 'react';

const PARALLAX_RATIO = 0.8;

const Parallax = ({
  medias,
  children,
  imageStyle,
}: {
  medias: Media[];
  children?: (props: { mediaId: string }) => ReactNode;
  imageStyle?: CSSProperties;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startPosition, setStartPosition] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setStartPosition(containerRef.current?.offsetTop ?? 0);
      setViewportHeight(window.innerHeight);
      setScrollY(window.scrollY);
    };

    handleScroll();
    window.addEventListener('resize', handleScroll);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('scroll', handleScroll);
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
            <div
              key={media.id}
              className={styles.parallaxItem}
              style={{
                transform: `translateY(${offset}px)`,
                willChange: 'transform',
              }}
            >
              {media.kind === 'video' ? (
                <CloudinaryVideo
                  assetKind="module"
                  media={media}
                  alt="cover"
                  fluid
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover', // Ensures the video covers the container
                    objectPosition: 'center', // Center the content
                    ...imageStyle,
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
                  alt="parallax"
                  fill
                  format="auto"
                  quality="auto:best"
                  style={{
                    objectFit: 'cover', // Ensures the image covers the container
                    objectPosition: 'center', // Center the content
                    ...imageStyle,
                  }}
                />
              )}
            </div>
            {children?.({ mediaId: media.id })}
          </div>
        );
      })}
    </div>
  );
};

export default Parallax;
