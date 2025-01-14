'use client';
import { useEffect, useRef, useState } from 'react';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
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
    <div className={styles.sectionPartContainer} ref={pictureRef}>
      <div className={styles.imageContainer}>
        <div
          style={{
            position: 'absolute',
            opacity: isVisible ? 1 : 0,
            transform: isVisible
              ? 'translateX(0)'
              : even
                ? 'translateX(-150px)'
                : 'translateX(150px)',
            transition: 'opacity 1s ease-in-out,transform 1s ease-out',
            overflow: 'visible',
            width: '100%',
            height: '100%',
          }}
        >
          {media.kind === 'video' ? (
            <CloudinaryVideo
              assetKind="module"
              media={media}
              alt="cover"
              width={480}
              height={480}
              className={styles.media}
              style={{
                borderRadius: cardStyle?.borderRadius ?? 0,
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
              alt="alternation"
              width={480}
              height={480}
              format="auto"
              crop={{
                type: 'fill',
                gravity: 'center',
              }}
              quality="auto:best"
              className={styles.media}
              style={{
                borderRadius: cardStyle?.borderRadius ?? 0,
                objectFit: 'cover',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AlternationImage;
