import { swapColor, DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './CoverRenderer.css';
import CoverTextRenderer from './CoverTextRenderer';
import type { Media, WebCard } from '@azzapp/data/domains';

type CoverRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children' | 'media'
> & {
  webCard: WebCard;
  media: Media;
  staticCover?: boolean;
};

const CoverRenderer = ({
  webCard,
  media,
  staticCover,
  style,
  ...props
}: CoverRendererProps) => {
  const { coverData, cardColors, coverTitle, coverSubTitle } = webCard;

  if (!coverData) {
    return null;
  }

  return (
    <div
      {...props}
      style={{
        aspectRatio: `${COVER_RATIO}`,
      }}
      className={styles.content}
    >
      <div
        {...props}
        style={{
          aspectRatio: `${COVER_RATIO}`,
          backgroundColor: swapColor(
            coverData.backgroundColor ?? 'light',
            cardColors ?? DEFAULT_COLOR_PALETTE,
          ),
          ...style,
        }}
        className={styles.content}
      >
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
          ) : staticCover ? (
            <CloudinaryImage
              mediaId={media.id}
              assetKind="cover"
              sizes="100vw"
              videoThumbnail
              alt="background"
              fill
              priority
              className={styles.coverMedia}
            />
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
      </div>
      <CoverTextRenderer
        title={coverTitle}
        titleStyle={coverData.titleStyle}
        subTitle={coverSubTitle}
        subTitleStyle={coverData.subTitleStyle}
        colorPalette={cardColors ?? DEFAULT_COLOR_PALETTE}
        textOrientation={coverData.textOrientation}
        textPosition={coverData.textPosition}
      />
    </div>
  );
};

export default CoverRenderer;
