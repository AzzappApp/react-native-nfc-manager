import cn from 'classnames';
import CloudinaryImage from '#ui/CloudinaryImage';
import CloudinaryVideo from '#ui/CloudinaryVideo';
import styles from './CoverRenderer.module.css';
import type { Media } from '@azzapp/data/domains';

type CoverRendererBackgroundProps = {
  media: Media | null;
};

const CoverRendererBackground = ({ media }: CoverRendererBackgroundProps) => {
  if (!media) return null;

  return media.kind === 'image' ? (
    <CloudinaryImage
      mediaId={media.id}
      alt="background"
      fill
      priority
      className={cn(styles.coverMedia, styles.backgroundMedia)}
    />
  ) : (
    <CloudinaryVideo
      media={media}
      alt="background"
      className={cn(styles.coverMedia, styles.backgroundMedia)}
      muted
      fluid
    />
  );
};

export default CoverRendererBackground;
