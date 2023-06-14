'use client';

import Image from 'next/image';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
} from '@azzapp/shared/imagesHelpers';
import type { ImageLoaderProps, ImageProps } from 'next/image';

export type CloudinaryImageProps = Omit<ImageProps, 'loader' | 'src'> & {
  mediaId: string;
  videoThumbnail?: boolean;
};

const CloudinaryImage = ({
  mediaId,
  videoThumbnail,
  ...props
}: CloudinaryImageProps) => (
  <Image
    src={mediaId}
    loader={videoThumbnail ? cloudinaryThumbnailLoader : cloudinaryImageLoader}
    {...props}
  />
);

export default CloudinaryImage;

const cloudinaryImageLoader = ({ src, width }: ImageLoaderProps): string =>
  getImageURLForSize(src, width);

const cloudinaryThumbnailLoader = ({ src, width }: ImageLoaderProps): string =>
  getVideoThumbnailURL(src, width);
