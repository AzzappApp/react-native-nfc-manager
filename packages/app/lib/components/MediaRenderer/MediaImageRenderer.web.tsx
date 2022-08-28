import { getImageURLForSize } from '@azzapp/shared/lib/imagesHelpers';
import Image from 'next/future/image';
import { StyleSheet } from 'react-native';
import createHTMLElement from '../../helpers/createHTMLElement';
import type { MediaImageRendererProps } from './types';
import type { ImageLoaderProps } from 'next/future/image';
import type { ForwardedRef } from 'react';
import type { HostComponent } from 'react-native';

const MediaImageRenderer = (
  {
    source,
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
      ? width / aspectRatio
      : `calc(${width} / ${aspectRatio})`;
  const imgSizeProps =
    typeof width === 'number'
      ? { width, height }
      : { sizes: width, fill: true };

  const flatStyle = StyleSheet.flatten(style);

  delete flatStyle['width'];
  delete flatStyle['height'];

  // @ts-expect-error web style
  flatStyle.objectFit = 'cover';

  return createHTMLElement(Image, {
    // TODO handle ref
    // ref,
    src: source,
    loader: cloudinaryLoader,
    onLoad: handleImageLoading,
    style: flatStyle,
    ...imgSizeProps,
  });
};

export default MediaImageRenderer;

// TODO use quality ?
const cloudinaryLoader = ({ src, width }: ImageLoaderProps): string =>
  getImageURLForSize(src, 1, width);
