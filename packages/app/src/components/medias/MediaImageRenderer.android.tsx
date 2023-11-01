import { Image } from 'expo-image';
import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { type HostComponent } from 'react-native';
import { useLocalCachedMediaFile } from '#helpers/mediaHelpers/AndroidLocalMediaCache';
import type { MediaImageRendererProps } from './mediasTypes';
import type { ImageErrorEventData, ImageStyle } from 'expo-image';
import type { ForwardedRef } from 'react';

/**
 * A native component that allows to display an image, based on Expo Image,
 */
const MediaImageRenderer = (
  {
    alt,
    source,
    onLoad,
    onReadyForDisplay,
    onError,
    style,
    tintColor,
    ...props
  }: MediaImageRendererProps,
  ref: ForwardedRef<HostComponent<any>>,
) => {
  const isReady = useRef(false);

  const sourceRef = useRef(source);
  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  const localFile = useLocalCachedMediaFile(source.mediaId, 'image');
  const onImageLoad = useCallback(() => {
    if (!isReady.current) {
      onReadyForDisplay?.();
      isReady.current = true;
    }
    if (!localFile) {
      const source = sourceRef.current;
      addLoadedMedia(source.mediaId, source.requestedSize, source.uri);
    }
    onLoad?.();
  }, [onLoad, localFile, onReadyForDisplay]);

  const onErrorInner = useCallback(
    (event: ImageErrorEventData) => {
      onError?.(new Error(event.error));
    },
    [onError],
  );

  const imageSource = useMemo(() => {
    if (localFile) {
      return { uri: localFile };
    }
    return source.uri;
  }, [localFile, source]);

  return (
    <Image
      ref={ref as any}
      recyclingKey={source.mediaId}
      source={imageSource}
      placeholder={getThumbnail(source.mediaId, source.requestedSize)}
      accessibilityRole="image"
      alt={alt}
      onLoad={onImageLoad}
      style={style as ImageStyle}
      tintColor={tintColor}
      onError={onErrorInner}
      {...props}
    />
  );
};

export default forwardRef(MediaImageRenderer);

const loadedMediaCache = new Map<
  string,
  Array<{ size: number; uri: string; date: Date }>
>();

const addLoadedMedia = (mediaId: string, size: number, uri: string) => {
  const medias = loadedMediaCache.get(mediaId) ?? [];
  medias.push({ size, uri, date: new Date() });
  loadedMediaCache.set(mediaId, medias);
};

const getThumbnail = (mediaId: string, size: number) => {
  let medias = loadedMediaCache.get(mediaId);
  if (!medias) {
    return null;
  }
  medias = medias.filter(
    media => media.date.getTime() <= Date.now() + 10 * 60 * 1000,
  );
  loadedMediaCache.set(mediaId, medias);
  let thumbnailUri: string | null = null;
  let currentSize: number = 0;
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i];
    if (Math.abs(media.size - size) < Math.abs(currentSize - size)) {
      thumbnailUri = media.uri;
      currentSize = media.size;
    }
  }
  return thumbnailUri;
};
