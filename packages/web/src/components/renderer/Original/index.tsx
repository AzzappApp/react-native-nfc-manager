'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import { AppearanceSliderContainer } from '../AppearanceSliderContainer';
import styles from './Original.css';
import type { Media } from '@azzapp/data';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { CSSProperties, ReactNode } from 'react';

const Original = ({
  medias,
  imageStyle,
  backgroundStyle,
  cardStyle,
}: {
  medias: Media[];
  children?: (props: { mediaId: string }) => ReactNode;
  imageStyle?: CSSProperties;
  backgroundStyle?: CSSProperties;
  cardStyle: CardStyle;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.moduleContainer}
      style={{ paddingBlock: cardStyle.gap / 2 }} // we want double padding around the main container
    >
      {medias.map(media => {
        return (
          <div key={media.id} className={styles.originalContainer}>
            <div
              className={styles.originalLayer}
              style={{ ...backgroundStyle, paddingBlock: cardStyle.gap / 2 }}
            >
              <OriginalItemMemo
                imageStyle={imageStyle}
                media={media}
                containerWidth={containerWidth}
                cardStyle={cardStyle}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OriginalItem = ({
  imageStyle,
  media,
  containerWidth = 0,
  cardStyle,
}: {
  imageStyle?: CSSProperties;
  media: Media;
  containerWidth?: number;
  cardStyle: CardStyle;
}) => {
  const aspectRatio = media.width / media.height;
  const pictureRef = useRef<HTMLDivElement>(null);

  const mediaStyle = useMemo(() => {
    return {
      objectFit: 'cover', // Ensures the image covers the container
      objectPosition: 'center', // Center the content
      touchAction: 'none' /* Prevents zoom gestures */,
      pointerEvents: 'none' /* Disables pointer interaction */,
      height: containerWidth / aspectRatio,
      width: containerWidth,
      borderRadius: cardStyle?.borderRadius ?? 0,
      ...imageStyle,
    } as const;
  }, [aspectRatio, cardStyle?.borderRadius, containerWidth, imageStyle]);

  const containerHeight = containerWidth / aspectRatio;
  return (
    <div className={styles.originalItem} ref={pictureRef}>
      <AppearanceSliderContainer pictureRef={pictureRef}>
        {media.kind === 'video' ? (
          <CloudinaryVideo
            assetKind="module"
            media={media}
            alt="original"
            fluid
            height={containerHeight}
            width={containerWidth}
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
            alt="original"
            height={containerHeight}
            width={containerWidth}
            sizes="100vw"
            format="auto"
            quality="auto:best"
            style={mediaStyle}
          />
        )}
      </AppearanceSliderContainer>
    </div>
  );
};

const OriginalItemMemo = memo(OriginalItem);

export default Original;
