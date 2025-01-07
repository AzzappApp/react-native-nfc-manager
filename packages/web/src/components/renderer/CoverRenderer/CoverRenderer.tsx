'use client';

import cn from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { swapColor, DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import {
  COVER_RATIO,
  DEFAULT_COVER_HEIGHT,
  DEFAULT_COVER_WIDTH,
} from '@azzapp/shared/coverHelpers';
import { DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL } from '@azzapp/shared/imagesHelpers';
import { Plus_Jakarta_ExtraBold, Plus_Jakarta_Light } from '#helpers/fonts';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import CoverLinksRenderer from './CoverLinksRenderer';
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

const CoverRenderer = ({
  webCard,
  media,
  staticCover,
  style,
  width,
  priority,
  ...props
}: CoverRendererProps) => {
  const {
    cardColors,
    coverTexts,
    coverBackgroundColor,
    coverDynamicLinks,
    coverPreviewPositionPercentage,
    coverIsPredefined,
    webCardKind,
    companyName,
    firstName,
    companyActivityLabel,
    lastName,
  } = webCard;
  const coverWidth = width ? width * 2 : DEFAULT_COVER_WIDTH * 2;
  const coverHeight = DEFAULT_COVER_HEIGHT;

  const overlayTitle = coverIsPredefined
    ? webCardKind === 'business'
      ? companyName
      : firstName
    : undefined;

  const overlaySubTitle = coverIsPredefined
    ? webCardKind === 'business'
      ? companyActivityLabel
      : lastName
    : undefined;

  const [coverSize, setCoverSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const cover = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = cover.current;

    const onCoverSizeChange = () => {
      if (current) {
        setCoverSize({
          width: cover.current.clientWidth,
          height: cover.current.clientHeight,
        });
      }
    };

    onCoverSizeChange();
    window?.addEventListener('resize', onCoverSizeChange);
    return () => {
      window?.removeEventListener('resize', onCoverSizeChange);
    };
  }, []);

  return (
    <div
      {...props}
      style={{
        aspectRatio: `${COVER_RATIO}`,
        width,
        borderRadius: width ? `${(35 / 300) * width}px` : undefined,
      }}
      className={styles.content}
      ref={cover}
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
            format="auto"
            quality="auto:best"
            rawTransformations={
              staticCover
                ? [
                    `so_${coverPreviewPositionPercentage ?? DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL}p`,
                  ]
                : undefined
            }
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
            playsInline
          />
        ))}
      {coverSize && (
        <CoverLinksRenderer
          coverSize={coverSize}
          links={coverDynamicLinks}
          cardColors={cardColors}
        />
      )}

      {overlayTitle && (
        <div className={cn(styles.overlayTitle, Plus_Jakarta_Light.className)}>
          {overlayTitle}
        </div>
      )}
      {overlaySubTitle && (
        <div
          className={cn(
            styles.overlaySubTitle,
            Plus_Jakarta_ExtraBold.className,
          )}
        >
          {overlaySubTitle}
        </div>
      )}
    </div>
  );
};

export default CoverRenderer;
