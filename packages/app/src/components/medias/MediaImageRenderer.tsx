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
    uri,
    alt,
    source,
    width,
    aspectRatio,
    onLoad,
    onReadyForDisplay,
    style,
    ...props
  }: MediaImageRendererProps,
  ref: ForwardedRef<HostComponent<any>>,
) => {
  if (typeof width === 'string') {
    console.error('Invalide `vw` size used on native media renderer');
    width = parseFloat(width.replace(/vw/g, ''));
  }

  const isReady = useRef(false);

  // we need to clean the state as fast as possible
  // to dispatch ready if in cache
  const uriRef = useRef(uri);
  if (uri !== uriRef.current) {
    uriRef.current = uri;
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
      source={{
        uri,
        mediaID: source,
        requestedSize: typeof width == 'number' ? width : 0,
      }}
      accessibilityRole="image"
      accessibilityLabel={alt}
      onLoad={onImageLoad}
      onPlaceHolderImageLoad={onPlaceHolderImageLoad}
      style={[{ width, aspectRatio, overflow: 'hidden' }, style]}
      {...props}
    />
  );
};

export default forwardRef(MediaImageRenderer);
