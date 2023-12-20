import { getCldImageUrl, getCldVideoUrl } from 'next-cloudinary';
import { forwardRef, type ForwardedRef } from 'react';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import { decodeMediaId } from '@azzapp/shared/imagesHelpers';
import { POST_VIDEO_SIZES } from '@azzapp/shared/postHelpers';
import type { Media } from '@azzapp/data/domains';

export type CloudinaryVideoProps = Omit<
  React.HTMLProps<HTMLVideoElement>,
  | 'autoPlay'
  | 'children'
  | 'height'
  | 'loop'
  | 'media'
  | 'poster'
  | 'ref'
  | 'src'
  | 'width'
> & {
  media: Media;
  assetKind: 'cover' | 'post';
  autoPlay?: boolean;
  loop?: boolean;
  alt: string;
  fluid?: boolean;
  width?: number;
  height?: number;
  posterSize?: {
    width: number;
    height: number;
  };
};

const CloudinaryVideo = (
  {
    media,
    assetKind,
    autoPlay = true,
    loop = true,
    width,
    style,
    fluid,
    posterSize,
    ...props
  }: CloudinaryVideoProps,
  ref: ForwardedRef<HTMLVideoElement>,
) => {
  if (width == null && !fluid) {
    throw new Error(
      'MediaVideoRenderer: width is required for non fluid video',
    );
  }

  const pregeneratedSizes =
    assetKind === 'cover' ? COVER_ASSET_SIZES : POST_VIDEO_SIZES;

  const maxSize = pregeneratedSizes.at(-1);

  return (
    <video
      ref={ref}
      poster={getCldImageUrl({
        src: decodeMediaId(media.id),
        assetType: 'video',
        format: 'auto',
        width: posterSize?.width,
        height: posterSize?.height,
      })}
      src={getCldVideoUrl({
        src: decodeMediaId(media.id),
        width,
        height: width && media.height * (width / media.width),
        aspectRatio: `${media.width / media.height}`,
      })}
      autoPlay={autoPlay}
      loop={loop}
      style={{
        aspectRatio: `${media.width / media.height}`,
        width,
        ...style,
      }}
      {...props}
    >
      {pregeneratedSizes.map(size => {
        const src = getCldVideoUrl({
          src: decodeMediaId(media.id),
          width: size,
          height: media.height * (size / media.width),
        });
        const mediaAttr = `all and (max-width: ${size}px)`;
        return (
          <source key={size} src={src} type="video/mp4" media={mediaAttr} />
        );
      })}
      <source
        key={maxSize}
        src={getCldVideoUrl({
          src: decodeMediaId(media.id),
          width: maxSize,
          height: maxSize && media.height * (maxSize / media.width),
        })}
        media="all"
      />
    </video>
  );
};

export default forwardRef(CloudinaryVideo);
