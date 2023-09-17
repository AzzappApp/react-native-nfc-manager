import { forwardRef, useRef } from 'react';
import NativeMediaImageRenderer from './NativeMediaImageRenderer';
import type { MediaImageRendererProps } from './mediasTypes';
import type { ForwardedRef } from 'react';
import type { HostComponent } from 'react-native';

/**
 * A native component that allows to display an image, it also implements
 * an aggressive cache system to allow to display images as fast as possible.
 * Uses the [nuke](https://github.com/kean/Nuke) on iOS and [Glide](https://github.com/bumptech/glide)
 * On Android.
 * If a version of the image in a different size is already in cache it will be used as a placeholder.
 */
const MediaImageRenderer = (
  {
    alt,
    source,
    aspectRatio,
    onLoad,
    onReadyForDisplay,
    style,
    tintColor,
    ...props
  }: MediaImageRendererProps,
  ref: ForwardedRef<HostComponent<any>>,
) => {
  const isReady = useRef(false);

  // we need to clean the state as fast as possible
  // to dispatch ready if in cache
  const uriRef = useRef(source.uri);
  if (source.uri !== uriRef.current) {
    uriRef.current = source.uri;
    isReady.current = false;
  }

  const onImageLoad = () => {
    if (!isReady.current) {
      onReadyForDisplay?.();
      isReady.current = true;
    }
    onLoad?.();
  };

  const onPlaceHolderImageLoad = () => {
    if (!isReady.current) {
      onReadyForDisplay?.();
      isReady.current = true;
    }
  };

  return (
    <NativeMediaImageRenderer
      ref={ref}
      source={source}
      accessibilityRole="image"
      accessibilityLabel={alt}
      onLoad={onImageLoad}
      onPlaceHolderImageLoad={onPlaceHolderImageLoad}
      style={[
        { width: source.requestedSize, aspectRatio, overflow: 'hidden' },
        style,
      ]}
      tintColor={tintColor}
      {...props}
    />
  );
};

export default forwardRef(MediaImageRenderer);
