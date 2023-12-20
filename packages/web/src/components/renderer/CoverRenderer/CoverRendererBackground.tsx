import cn from 'classnames';
import { getCldImageUrl } from 'next-cloudinary';
import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { decodeMediaId } from '@azzapp/shared/imagesHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './CoverRenderer.css';
import type { Media, WebCard } from '@azzapp/data/domains';

type CoverRendererBackgroundProps = {
  media: Media | null;
  webCard: WebCard;
};

const BACKGROUND_IMAGE_SIZE = 320;

const CoverRendererBackground = ({
  media,
  webCard: { coverData, cardColors },
}: CoverRendererBackgroundProps) => {
  if (!media) return null;

  return (
    <div
      className={styles.wrapper}
      style={{
        backgroundColor: swapColor(
          coverData?.backgroundColor ?? 'light',
          cardColors ?? DEFAULT_COLOR_PALETTE,
        ),
      }}
    >
      {coverData?.backgroundId && (
        <div
          style={{
            backgroundColor:
              swapColor(
                coverData.backgroundPatternColor,
                cardColors ?? DEFAULT_COLOR_PALETTE,
              ) ?? '#000',
            WebkitMaskImage: `url(${getCldImageUrl({
              src: decodeMediaId(coverData.backgroundId),
              width: BACKGROUND_IMAGE_SIZE,
              height: BACKGROUND_IMAGE_SIZE / COVER_RATIO,
              format: 'auto',
            })})`,
            maskImage: `url(${getCldImageUrl({
              src: decodeMediaId(coverData.backgroundId),
              width: BACKGROUND_IMAGE_SIZE,
              height: BACKGROUND_IMAGE_SIZE / COVER_RATIO,
              format: 'auto',
            })})`,
            maskPosition: 'bottom',
            WebkitMaskPosition: 'bottom',
          }}
          className={styles.layerMedia}
        />
      )}
      <CloudinaryImage
        mediaId={media.id}
        alt="background"
        quality={1}
        fill
        sizes="100vw"
        videoThumbnail={media.kind === 'video'}
        className={cn(styles.coverMedia, styles.backgroundMedia)}
      />
      {coverData?.foregroundId && !coverData?.foregroundId.startsWith('l:') && (
        <div
          style={{
            backgroundColor:
              swapColor(
                coverData.foregroundColor,
                cardColors ?? DEFAULT_COLOR_PALETTE,
              ) ?? '#000',
            WebkitMaskImage: `url(${getCldImageUrl({
              src: decodeMediaId(coverData.foregroundId),
              width: BACKGROUND_IMAGE_SIZE,
              height: BACKGROUND_IMAGE_SIZE / COVER_RATIO,
              format: 'auto',
            })})`,
            maskImage: `url(${getCldImageUrl({
              src: decodeMediaId(coverData.foregroundId),
              width: BACKGROUND_IMAGE_SIZE,
              height: BACKGROUND_IMAGE_SIZE / COVER_RATIO,
              format: 'auto',
            })})`,
            maskPosition: 'bottom',
            WebkitMaskPosition: 'bottom',
          }}
          className={styles.layerMedia}
        />
      )}
    </div>
  );
};

export default CoverRendererBackground;
