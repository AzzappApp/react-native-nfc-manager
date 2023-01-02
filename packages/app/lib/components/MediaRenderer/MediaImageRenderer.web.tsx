import { getImageURLForSize } from '@azzapp/shared/lib/imagesHelpers';
import Image from 'next/image';
import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import createHTMLElement from '../../helpers/createHTMLElement';
import type { MediaImageRendererProps } from './types';
import type { ImageLoaderProps } from 'next/image';
import type { ForwardedRef } from 'react';
import type { HostComponent } from 'react-native';

const MediaImageRenderer = (
  {
    source,
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
    loader: cloudinaryLoader,
    onLoad: handleImageLoading,
    style: flatStyle,
    ...imgSizeProps,
  });
};

export default forwardRef(MediaImageRenderer);

// TODO use quality ?
const cloudinaryLoader = ({ src, width }: ImageLoaderProps): string =>
  getImageURLForSize(src, 1, width);

export const addCacheEntry = () => void 0;
