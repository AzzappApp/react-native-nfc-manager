'use client';

import { swapColor, DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './CoverRenderer.css';
import type { Media, WebCard } from '@azzapp/data';

type CoverRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children' | 'media' | 'width'
> & {
  webCard: WebCard;
  media: Media;
  staticCover?: boolean;
  width?: number;
  priority?: boolean;
};

const DEFAULT_COVER_WIDTH = 375;

const CoverRenderer = ({
  webCard,
  media,
  staticCover,
  style,
  width,
  priority,
  ...props
}: CoverRendererProps) => {
  const { cardColors, coverTexts, coverBackgroundColor } = webCard;

  const coverWidth = width ? width * 2 : DEFAULT_COVER_WIDTH * 2;
  const coverHeight = coverWidth / COVER_RATIO;

  return (
    <div
      {...props}
      style={{
        aspectRatio: `${COVER_RATIO}`,
        width,
        borderRadius: width ? `${(35 / 300) * width}px` : undefined,
      }}
      className={styles.content}
    >
      <div
        style={{
          backgroundColor: swapColor(
            coverBackgroundColor ?? 'light',
            cardColors ?? DEFAULT_COLOR_PALETTE,
          ),
          borderRadius: width ? `${(39 / 300) * width}px` : undefined,
        }}
        className={styles.backgroundContent}
      />
      {media != null &&
        (media.kind === 'image' || staticCover ? (
          <CloudinaryImage
            mediaId={media.id}
            alt={coverTexts?.join(' ') ?? ''}
            width={coverWidth}
            height={coverHeight}
            priority={priority}
            className={styles.coverMedia}
            fetchPriority={priority ? 'high' : 'low'}
            videoThumbnail={media.kind === 'video'}
          />
        ) : (
          <CloudinaryVideo
            media={media}
            assetKind="cover"
            alt="cover"
            autoPlay
            loop
            className={styles.coverMedia}
            muted
            fluid
            posterSize={{
              width: coverWidth,
              height: coverHeight,
            }}
            playsInline
          />
        ))}
    </div>
  );
};

export default CoverRenderer;
