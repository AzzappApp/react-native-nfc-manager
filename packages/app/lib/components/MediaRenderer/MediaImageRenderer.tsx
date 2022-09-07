import { forwardRef, useRef } from 'react';
import { NativeModules, requireNativeComponent } from 'react-native';
import type { MediaImageRendererProps } from './types';
import type { ForwardedRef } from 'react';
import type { HostComponent } from 'react-native';

const MediaImageRenderer = (
  {
    uri,
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
    onReadyForDisplay?.();
    isReady.current = true;
  };

  return (
    <NativeMediaImageRenderer
      ref={ref}
      source={{
        uri,
        mediaID: source,
        requestedSize: typeof width == 'number' ? width : 0,
      }}
      onLoad={onImageLoad}
      onPlaceHolderImageLoad={onPlaceHolderImageLoad}
      style={[style, { width, aspectRatio, overflow: 'hidden' }]}
      {...props}
    />
  );
};

export const addCacheEntry = (mediaID: string, size: number, uri: string) => {
  NativeModules.AZPMediaImageRendererManager.addCacheEntry(mediaID, size, uri);
};

export default forwardRef(MediaImageRenderer);

export const NativeMediaImageRenderer: React.ComponentType<any> =
  requireNativeComponent('AZPMediaImageRenderer');
