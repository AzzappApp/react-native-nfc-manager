'use client';
import {
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/imagesHelpers';
import type { Media } from '@azzapp/data/domains';

type CloudinaryVideoProps = Omit<
  React.HTMLProps<HTMLVideoElement>,
  | 'autoPlay'
  | 'children'
  | 'height'
  | 'loop'
  | 'media'
  | 'poster'
  | 'src'
  | 'width'
> & {
  media: Media;
  autoPlay?: boolean;
  loop?: boolean;
  alt: string;
  fluid?: boolean;
  width?: number;
  height?: number;
};

const CloudinaryVideo = ({
  media,
  autoPlay = true,
  loop = true,
  width,
  style,
  fluid,
  ...props
}: CloudinaryVideoProps) => {
  if (width == null && !fluid) {
    throw new Error(
      'MediaVideoRenderer: width is required for non fluid video',
    );
  }
  const sizes = width != null ? [2 * width] : SIZES;
  return (
    <video
      poster={getVideoThumbnailURL(media.id)}
      src={getVideoUrlForSize(media.id)}
      autoPlay={autoPlay}
      loop={loop}
      style={{ aspectRatio: `${media.width / media.height}`, width, ...style }}
      {...props}
    >
      {sizes.map((size, index) => {
        const src = getVideoUrlForSize(
          media.id,
          Math.min(2 * size, media.width),
        );
        const mediaAttr =
          index === sizes.length - 1 ? 'all' : `all and (max-width: ${size}px)`;
        return (
          <source key={size} src={src} type="video/mp4" media={mediaAttr} />
        );
      })}
    </video>
  );
};

export default CloudinaryVideo;

const SIZES = [512, 1024, 1440, 1920];
