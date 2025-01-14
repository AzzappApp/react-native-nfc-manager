'use client';
import { useRef } from 'react';
import { AppearanceSliderContainer } from '#components/renderer/AppearanceSliderContainer';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './index.css';

const GridItem = ({ media, index, cardStyle }: any) => {
  const pictureRef = useRef<HTMLDivElement>(null);
  return (
    <div
      key={`${media.id}_${index}`}
      className={styles.item}
      style={{
        borderRadius: cardStyle?.borderRadius ?? 0,
        overflow: 'hidden',
        aspectRatio: `${media.width} / ${media.height}`,
      }}
      ref={pictureRef}
    >
      <AppearanceSliderContainer pictureRef={pictureRef}>
        {media.kind === 'video' ? (
          <CloudinaryVideo
            assetKind="module"
            media={media}
            alt="grid"
            fluid
            style={{
              objectFit: 'cover',
              width: '100%',
            }}
            className={styles.image}
            width={media.width}
            height={media.height}
            playsInline
            autoPlay
            muted
            loop
          />
        ) : (
          <CloudinaryImage
            mediaId={media.id}
            draggable={false}
            alt="grid"
            className={styles.image}
            width={EXPECTED_MEDIA_WIDTH}
            height={(EXPECTED_MEDIA_WIDTH * media.height) / media.width}
            style={{
              objectFit: 'fill',
              borderRadius: cardStyle?.borderRadius ?? 0,
            }}
          />
        )}
      </AppearanceSliderContainer>
    </div>
  );
};

const EXPECTED_MEDIA_WIDTH = 1080;

export default GridItem;
