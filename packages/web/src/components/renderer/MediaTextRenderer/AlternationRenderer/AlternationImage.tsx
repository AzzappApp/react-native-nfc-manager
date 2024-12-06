'use client';
import { useEffect, useRef, useState } from 'react';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './AlternationRenderer.css';
import type { Media } from '@azzapp/data';
import type { CardStyle } from '@azzapp/shared/cardHelpers';

const AlternationImage = ({
  media,
  even,
  cardStyle,
}: {
  media: Media;
  even: boolean;
  cardStyle: CardStyle;
}) => {
  const pictureRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = pictureRef.current;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }, // Trigger when 10% of the element is visible
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translateX(0)'
          : even
            ? 'translateX(150px)'
            : 'translateX(-150px)',
        transition: 'all 1s ease-out',
      }}
      ref={pictureRef}
    >
      <CloudinaryImage
        mediaId={media.id}
        draggable={false}
        alt="alternation"
        format="auto"
        width={480}
        height={480}
        quality="auto:best"
        crop="fill"
        className={styles.image}
        style={{
          borderRadius: cardStyle?.borderRadius ?? 0,
        }}
      />
    </div>
  );
};

export default AlternationImage;
