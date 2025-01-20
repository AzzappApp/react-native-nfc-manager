'use client';
import { useEffect, useRef, useState } from 'react';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './AlternationRenderer.css';
import type { Media } from '@azzapp/data';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { CSSProperties } from 'react';

const mediaResolution = 480;

const AlternationMedia = ({
  media,
  even,
  cardStyle,
  isFullAlternation,
}: {
  media: Media;
  even: boolean;
  cardStyle: CardStyle;
  isFullAlternation?: boolean;
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
      className={
        isFullAlternation
          ? styles.sectionPartFullAlternationContainer
          : styles.sectionPartContainer
      }
      ref={pictureRef}
      style={
        {
          '--cardStyle-gap': `${cardStyle.gap}px`,
          '--cardStyle-gap-left': even ? '0px' : `${cardStyle.gap}px`,
          '--cardStyle-gap-right': even ? `${cardStyle.gap}px` : '0px',
        } as CSSProperties & Record<string, any>
      }
    >
      <div className={styles.imageContainer}>
        <div
          style={{
            position: 'absolute',
            opacity: isVisible ? 1 : 0,
            transform:
              isVisible || isFullAlternation
                ? 'translateX(0)'
                : even
                  ? 'translateX(150px)'
                  : 'translateX(-150px)',
            transition: isFullAlternation
              ? 'opacity 1s ease-in-out'
              : 'opacity 1s ease-in-out,transform 1s ease-out',
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
              width={mediaResolution}
              height={mediaResolution}
              className={styles.media}
              style={{
                borderRadius: isFullAlternation
                  ? 0
                  : (cardStyle?.borderRadius ?? 0), // FIXME TBC
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
              width={mediaResolution}
              height={mediaResolution}
              format="auto"
              crop={{
                type: 'fill',
                gravity: 'center',
              }}
              quality="auto:best"
              className={styles.media}
              style={{
                borderRadius: isFullAlternation
                  ? 0
                  : (cardStyle?.borderRadius ?? 0),
                objectFit: 'cover',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AlternationMedia;
