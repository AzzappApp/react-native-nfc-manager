'use client';

import { memoize } from 'lodash';
import Image from 'next/image';
import { MODULE_IMAGES_SIZES } from '@azzapp/shared/cardModuleHelpers';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
} from '@azzapp/shared/imagesHelpers';
import { POST_IMAGES_SIZES } from '@azzapp/shared/postHelpers';
import type { ImageLoaderProps, ImageProps } from 'next/image';

export type CloudinaryImageProps = Omit<ImageProps, 'loader' | 'src'> & {
  mediaId: string;
  videoThumbnail?: boolean;
  assetKind: 'cover' | 'module' | 'post';
};

const CloudinaryImage = ({
  mediaId,
  videoThumbnail,
  assetKind,
  ...props
}: CloudinaryImageProps) => (
  <Image
    src={mediaId}
    loader={cloudinaryImageLoader(assetKind, !!videoThumbnail)}
    {...props}
  />
);

export default CloudinaryImage;

const cloudinaryImageLoader = memoize(
  (usage: 'cover' | 'module' | 'post', thumbnail: boolean) =>
    ({ src, width }: ImageLoaderProps): string => {
      const pregeneratedSizes =
        usage === 'cover'
          ? COVER_ASSET_SIZES
          : usage === 'module'
          ? MODULE_IMAGES_SIZES
          : POST_IMAGES_SIZES;

      const uriGenerator = thumbnail
        ? getVideoThumbnailURL
        : getImageURLForSize;

      return uriGenerator(src, width, null, null, pregeneratedSizes);
    },
  (usage: 'cover' | 'module' | 'post', thumbnail: boolean) =>
    `${usage}-${thumbnail ? 'thumbnail' : 'image'}`,
);
