import cn from 'classnames';
import { getCldImageUrl } from 'next-cloudinary';
import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { decodeMediaId } from '@azzapp/shared/imagesHelpers';
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
    <>
      {coverData?.backgroundId && (
        <>
          <div
            style={{
              backgroundColor: swapColor(
                coverData.backgroundColor ?? 'light',
                cardColors ?? DEFAULT_COLOR_PALETTE,
              ),
            }}
            className={cn(styles.layerMedia)}
          />
          <div
            style={{
              backgroundColor:
                swapColor(
                  coverData.backgroundPatternColor,
                  cardColors ?? DEFAULT_COLOR_PALETTE,
                ) ?? '#000',
              maskImage: `url(${getCldImageUrl({
                src: decodeMediaId(coverData.backgroundId),
                width: BACKGROUND_IMAGE_SIZE,
                height: BACKGROUND_IMAGE_SIZE / COVER_RATIO,
                format: 'auto',
              })})`,
              maskPosition: 'center',
            }}
            className={cn(styles.layerMedia, styles.layerBackground)}
          />
        </>
      )}
      <div
        className={cn(styles.coverMedia, styles.backgroundMedia)}
        style={{
          backgroundImage: `url(${getCldImageUrl({
            src: decodeMediaId(media.id),
            assetType: media.kind,
            width: BACKGROUND_IMAGE_SIZE,
            height: BACKGROUND_IMAGE_SIZE / COVER_RATIO,
            format: 'auto',
          })})`,
        }}
      />
    </>
  );
};

export default CoverRendererBackground;
