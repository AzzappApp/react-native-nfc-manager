import Image from 'next/image';
import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
} from '@azzapp/shared/imagesHelpers';
import createHTMLElement from '#helpers/createHTMLElement';
import type { MediaImageRendererProps } from './mediasTypes';
import type { ImageLoaderProps } from 'next/image';
import type { ForwardedRef } from 'react';
import type { HostComponent } from 'react-native';

const MediaImageRenderer = (
  {
    source,
    isVideo,
    alt,
    width,
    aspectRatio,
    onLoad,
    onReadyForDisplay,
    style,
  }: MediaImageRendererProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ref: ForwardedRef<HostComponent<any>>,
) => {
  const handleImageLoading = () => {
    onReadyForDisplay?.();
    onLoad?.();
  };

  const height =
    typeof width === 'number'
      ? Math.round(width / aspectRatio)
      : `calc(${width} / ${aspectRatio})`;
  const imgSizeProps =
    typeof width === 'number' && typeof height === 'number'
      ? { width, height }
      : { sizes: width as string, fill: true };

  const flatStyle = StyleSheet.flatten(style);

  delete flatStyle['width'];
  delete flatStyle['height'];

  // @ts-expect-error web style
  flatStyle.objectFit = 'cover';

  return createHTMLElement(Image, {
    // TODO handle ref
    // ref,
    src: source,
    alt,
    loader: isVideo ? cloudinaryThumbnailLoader : cloudinaryImageLoader,
    onLoad: handleImageLoading,
    style: flatStyle,
    ...imgSizeProps,
  });
};

export default forwardRef(MediaImageRenderer);

// TODO use quality ?
const cloudinaryImageLoader = ({ src, width }: ImageLoaderProps): string =>
  getImageURLForSize(src, width);

const cloudinaryThumbnailLoader = ({ src, width }: ImageLoaderProps): string =>
  getVideoThumbnailURL(src, width);

export const addCacheEntry = () => void 0;
