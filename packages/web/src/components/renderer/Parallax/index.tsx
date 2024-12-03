'use client';

import { useEffect, useRef, useState } from 'react';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './Parallax.css';
import type { Media } from '@azzapp/data';
import type { ReactNode } from 'react';

const Parallax = ({
  medias,
  children,
}: {
  medias: Media[];
  children?: (props: { mediaId: string }) => ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startPosition, setStartPosition] = useState<number>(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const updateStartPosition = () => {
      if (!containerRef.current) return;

      setStartPosition(containerRef.current?.offsetTop ?? 0);
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    updateStartPosition();
    handleScroll();
    window.addEventListener('resize', updateStartPosition);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', updateStartPosition);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const parallaxRatio = 0.2;
  const viewportHeight = window.innerHeight;

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

        const offset = isVisible ? distanceFromStart * parallaxRatio : 0;

        return (
          <div key={media.id} className={styles.parallaxContainer}>
            <div key={media.id} className={styles.parallaxItem}>
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
                  transition: 'transform 0.1s ease-out',
                  transform: `translateY(${offset}px)`, // Apply calculated offset
                }}
              />
            </div>
            {children?.({ mediaId: media.id })}
          </div>
        );
      })}
    </div>
  );
};

export default Parallax;
