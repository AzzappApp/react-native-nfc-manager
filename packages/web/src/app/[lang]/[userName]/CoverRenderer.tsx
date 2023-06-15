import { getMediasByIds } from '@azzapp/data/domains';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './CoverRenderer.module.css';
import type { CardCover } from '@azzapp/data/domains';

type CoverRendererProps = Omit<React.HTMLProps<HTMLDivElement>, 'children'> & {
  cover: CardCover;
};

const CoverRenderer = async ({
  cover: { title, subTitle, mediaId, textPreviewMediaId },
  ...props
}: CoverRendererProps) => {
  const [media] = await getMediasByIds([mediaId]);
  return (
    <div
      {...props}
      style={Object.assign({ aspectRatio: COVER_RATIO, position: 'relative' })}
    >
      {media != null &&
        (media.kind === 'image' ? (
          <CloudinaryImage
            mediaId={media.id}
            alt="background"
            sizes="100vw"
            fill
            priority
            className={styles.coverMedia}
          />
        ) : (
          <CloudinaryVideo
            media={media}
            alt="background"
            className={styles.coverMedia}
            muted
            fluid
          />
        ))}
      {textPreviewMediaId && (
        <h1 className={styles.coverMedia}>
          <CloudinaryImage
            mediaId={textPreviewMediaId}
            alt={`${title} - ${subTitle}`}
            className={styles.coverMedia}
            sizes="100vw"
            fill
            priority
          />
        </h1>
      )}
    </div>
  );
};

export default CoverRenderer;
