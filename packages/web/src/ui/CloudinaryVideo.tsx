import { getCldImageUrl, getCldVideoUrl } from 'next-cloudinary';
import { forwardRef, type ForwardedRef } from 'react';
import { MODULE_VIDEO_SIZES } from '@azzapp/shared/cardModuleHelpers';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import { DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL } from '@azzapp/shared/imagesHelpers';
import { POST_VIDEO_SIZES } from '@azzapp/shared/postHelpers';
import type { Media } from '@azzapp/data';

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
  assetKind: 'cover' | 'module' | 'post';
  autoPlay?: boolean;
  loop?: boolean;
  alt: string;
  fluid?: boolean;
  width?: number;
  height?: number;
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
    assetKind === 'cover'
      ? COVER_ASSET_SIZES
      : assetKind === 'module'
        ? MODULE_VIDEO_SIZES
        : POST_VIDEO_SIZES;

  const maxSize = pregeneratedSizes.at(-1);

  return (
    <video
      ref={ref}
      playsInline // for safari mobile: https://webkit.org/blog/6784/new-video-policies-for-ios/
      poster={getCldImageUrl({
        src: media.id,
        assetType: 'video',
        format: 'auto',
        quality: 'auto:best',
        width: maxSize,
        height: maxSize && media.height * (maxSize / media.width),
        rawTransformations: [`so_${DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL}p`],
      })}
      src={getCldVideoUrl({
        src: media.id,
        width,
        height: width && media.height * (width / media.width),
        aspectRatio: `${media.width / media.height}`,
        format: 'mp4', // for safari
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
          src: media.id,
          width: size,
          height: media.height * (size / media.width),
          format: 'mp4',
        });
        const mediaAttr = `all and (max-width: ${size}px)`;
        return (
          <source key={size} src={src} type="video/mp4" media={mediaAttr} />
        );
      })}
      <source
        key={maxSize}
        src={getCldVideoUrl({
          src: media.id,
          width: maxSize,
          height: maxSize && media.height * (maxSize / media.width),
          format: 'mp4',
        })}
        media="all"
      />
    </video>
  );
};

export default forwardRef(CloudinaryVideo);
