'use client';

import { CldImage } from 'next-cloudinary';
import { forwardRef, type ForwardedRef } from 'react';
import { decodeMediaId } from '@azzapp/shared/imagesHelpers';
import type { CldImageProps } from 'next-cloudinary';

export type CloudinaryImageProps = Omit<CldImageProps, 'loader' | 'src'> & {
  mediaId: string;
  videoThumbnail?: boolean;
};

const CloudinaryImage = (
  { mediaId, videoThumbnail, format = 'auto', ...props }: CloudinaryImageProps,
  ref: ForwardedRef<HTMLImageElement>,
) => (
  <CldImage
    ref={ref}
    src={decodeMediaId(mediaId)}
    assetType={videoThumbnail ? 'video' : 'image'}
    format={format}
    {...props}
  />
);

export default forwardRef(CloudinaryImage);
