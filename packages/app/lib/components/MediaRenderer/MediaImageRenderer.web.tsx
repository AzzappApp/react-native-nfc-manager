import { getImageURLForSize } from '@azzapp/shared/lib/imagesHelpers';
import omit from 'lodash/omit';
import Image from 'next/future/image';
import { StyleSheet } from 'react-native';
import createHTMLElement from '../../helpers/createHTMLElement';
import type { MediaInnerRendererProps } from './types';
import type { ImageLoaderProps } from 'next/future/image';

const MediaImageRenderer = ({
  source,
  width,
  aspectRatio,
  onLoad,
  onReadyForDisplay,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mediaRef,
  style,
  ...props
}: MediaInnerRendererProps) => {
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
    // ref: mediaRef,
    src: source,
    loader: cloudinaryLoader,
    onLoad: handleImageLoading,
    style: flatStyle,
    ...imgSizeProps,
    ...omit(props, [
      'uri',
      'paused',
      'muted',
      'repeat',
      'playWhenInactive',
      'allowsExternalPlayback',
      'currentTime',
      'onEnd',
      'onProgress',
    ]),
  });
};

export default MediaImageRenderer;

// TODO use quality ?
const cloudinaryLoader = ({ src, width }: ImageLoaderProps): string =>
  getImageURLForSize(src, 1, width);
