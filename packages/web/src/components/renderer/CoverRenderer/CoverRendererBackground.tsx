import cn from 'classnames';
import { getCldImageUrl } from 'next-cloudinary';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { decodeMediaId } from '@azzapp/shared/imagesHelpers';
import styles from './CoverRenderer.css';
import type { Media } from '@azzapp/data';

type CoverRendererBackgroundProps = {
  media: Media | null;
};

const BACKGROUND_IMAGE_SIZE = 320;

const CoverRendererBackground = ({ media }: CoverRendererBackgroundProps) => {
  if (!media) return null;

  return (
    <>
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
