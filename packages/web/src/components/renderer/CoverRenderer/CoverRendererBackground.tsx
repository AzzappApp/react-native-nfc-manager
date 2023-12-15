import cn from 'classnames';
import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import { getImageURL } from '@azzapp/shared/imagesHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './CoverRenderer.css';
import type { Media, WebCard } from '@azzapp/data/domains';

type CoverRendererBackgroundProps = {
  media: Media | null;
  webCard: WebCard;
};

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
            WebkitMaskImage: `url(${getImageURL(coverData.backgroundId)})`,
            maskImage: `url(${getImageURL(coverData.backgroundId)})`,
            maskPosition: 'bottom',
            WebkitMaskPosition: 'bottom',
          }}
          className={styles.layerMedia}
        />
      )}
      <CloudinaryImage
        mediaId={media.id}
        assetKind="cover"
        alt="background"
        fill
        priority
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
            WebkitMaskImage: `url(${getImageURL(coverData.foregroundId)})`,
            maskImage: `url(${getImageURL(coverData.foregroundId)})`,
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
