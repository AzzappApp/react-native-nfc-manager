import { swapColor, DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './CoverRenderer.css';
import CoverTextRenderer from './CoverTextRenderer';
import type { Media, WebCard } from '@azzapp/data/domains';

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
  const { coverData, cardColors, coverTitle, coverSubTitle } = webCard;

  const coverWidth = width ? width * 2 : DEFAULT_COVER_WIDTH * 2;
  const coverHeight = coverWidth / COVER_RATIO;
  if (!coverData) {
    return null;
  }

  return (
    <div
      {...props}
      style={{
        aspectRatio: `${COVER_RATIO}`,
        width,
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
                alt="cover"
                width={coverWidth}
                height={coverHeight}
                priority={priority}
                className={styles.coverMedia}
                fetchPriority={priority ? 'high' : 'low'}
              />
            </>
          ) : staticCover ? (
            <CloudinaryImage
              mediaId={media.id}
              videoThumbnail
              width={coverWidth}
              height={coverHeight}
              alt="cover"
              className={styles.coverMedia}
            />
          ) : (
            <CloudinaryVideo
              media={media}
              assetKind="cover"
              alt="cover"
              className={styles.coverMedia}
              muted
              fluid
              posterSize={{
                width: coverWidth,
                height: coverHeight,
              }}
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
        width={width}
      />
    </div>
  );
};

export default CoverRenderer;
