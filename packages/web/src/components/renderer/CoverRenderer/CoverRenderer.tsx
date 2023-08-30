import 'server-only';
import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { getImageURL } from '@azzapp/shared/imagesHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './CoverRenderer.css';
import CoverRendererBackground from './CoverRendererBackground';
import type { Media, Profile } from '@azzapp/data/domains';

type CoverRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children' | 'media'
> & {
  profile: Profile;
  media: Media;
};

const CoverRenderer = async ({
  profile: { coverData, coverTitle, coverSubTitle, cardColors },
  media,
  style,
  ...props
}: CoverRendererProps) => {
  if (!coverData) {
    return null;
  }
  const { textPreviewMediaId } = coverData;
  // TODO render foreground
  return (
    <div {...props} style={{ position: 'relative', ...style }}>
      <CoverRendererBackground media={media} />
      <div
        {...props}
        style={{
          aspectRatio: `${COVER_RATIO}`,
          backgroundColor: swapColor(
            coverData.backgroundColor ?? 'light',
            cardColors ?? DEFAULT_COLOR_PALETTE,
          ),
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
        {textPreviewMediaId && (
          <h1 className={styles.coverMedia}>
            <CloudinaryImage
              mediaId={textPreviewMediaId}
              assetKind="cover"
              alt={`${coverTitle} - ${coverSubTitle}`}
              className={styles.coverMedia}
              sizes="100vw"
              fill
              priority
            />
          </h1>
        )}
      </div>
    </div>
  );
};

export default CoverRenderer;
