import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { getImageURL } from '@azzapp/shared/imagesHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './CoverRenderer.css';
import type { Media, WebCard } from '@azzapp/data/domains';

type CoverPreviewProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children' | 'media'
> & {
  webCard: WebCard;
  media: Media;
};

const CoverPreview = ({ webCard, media, ...props }: CoverPreviewProps) => {
  const { coverData, cardColors } = webCard;

  if (!coverData) return null;

  return (
    <div
      {...props}
      style={{
        aspectRatio: `${COVER_RATIO}`,
        backgroundColor: swapColor(
          coverData.backgroundColor ?? 'light',
          cardColors ?? DEFAULT_COLOR_PALETTE,
        ),
        ...props.style,
      }}
      className={styles.content}
    >
      {coverData.backgroundId && (
        <div
          style={{
            backgroundColor:
              swapColor(
                coverData.backgroundPatternColor,
                cardColors ?? DEFAULT_COLOR_PALETTE,
              ) ?? '#000',
            WebkitMaskImage: `url(${getImageURL(coverData.backgroundId)})`,
            maskImage: `url(${getImageURL(coverData.backgroundId)})`,
          }}
          className={styles.layerMedia}
        />
      )}
      {media != null &&
        (media.kind === 'image' ? (
          <>
            <CloudinaryImage
              mediaId={media.id}
              assetKind="cover"
              alt="background"
              sizes="100vw"
              fill
              priority
              className={styles.coverMedia}
            />
          </>
        ) : (
          <CloudinaryVideo
            media={media}
            assetKind="cover"
            alt="background"
            className={styles.coverMedia}
            muted
            fluid
            playsInline
            autoPlay
          />
        ))}
      {coverData.foregroundId && (
        <div
          style={{
            backgroundColor:
              swapColor(
                coverData.foregroundColor,
                cardColors ?? DEFAULT_COLOR_PALETTE,
              ) ?? '#000',
            WebkitMaskImage: `url(${getImageURL(coverData.foregroundId)})`,
            maskImage: `url(${getImageURL(coverData.foregroundId)})`,
          }}
          className={styles.layerMedia}
        />
      )}
    </div>
  );
};

export default CoverPreview;
