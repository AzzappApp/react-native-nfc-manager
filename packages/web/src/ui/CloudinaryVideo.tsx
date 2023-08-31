'use client';
import { forwardRef, type ForwardedRef } from 'react';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import {
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/imagesHelpers';
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
    assetKind === 'cover' ? COVER_ASSET_SIZES : POST_VIDEO_SIZES;

  const maxSize = pregeneratedSizes.at(-1);
  return (
    <video
      ref={ref}
      poster={getVideoThumbnailURL(media.id)}
      src={getVideoUrlForSize(media.id)}
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
        const src = getVideoUrlForSize(media.id, size);
        const mediaAttr = `all and (max-width: ${size}px)`;
        return (
          <source key={size} src={src} type="video/mp4" media={mediaAttr} />
        );
      })}
      <source
        key={maxSize}
        src={getVideoUrlForSize(media.id, maxSize)}
        media="all"
      />
    </video>
  );
};

export default forwardRef(CloudinaryVideo);
