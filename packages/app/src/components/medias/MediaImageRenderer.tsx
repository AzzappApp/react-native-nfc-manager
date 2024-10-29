import { Image } from 'expo-image';
import isEqual from 'lodash/isEqual';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import {
  captureSnapshot,
  SnapshotRenderer,
} from '@azzapp/react-native-snapshot-view';
import { useLocalCachedMediaFile } from '#helpers/mediaHelpers/LocalMediaCache';
import type { ImageContentFit, ImageErrorEventData } from 'expo-image';
import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native';

/**
 * The type of the MediaVideoRenderer ref
 */
export type MediaImageRendererHandle = {
  /**
   * Snapshots the current video frame, allowing the next time a MediaVideoRenderer is mounted
   * to display the snapshot while the video is loading
   */
  snapshot(): Promise<void>;
};

export type MediaImageRendererProps = ViewProps & {
  /**
   * if true, the MediaImageRenderer will display the first frame of the video
   */
  isVideo?: boolean;
  /**
   * The media alt text
   */
  alt?: string;
  /**
   * The source containing the uri of the media, the cacheId and the requestedSize
   */
  source: { uri: string; mediaId: string; requestedSize: number };
  /**
   * The media tintColor
   */
  tintColor?: string | null;
  /**
   * A callback called when the media is loaded
   */
  onLoad?: () => void;
  /**
   * A callback called when the media is ready to be displayed
   * (the displayed image might be an other version of the original image in a different size)
   */
  onReadyForDisplay?: () => void;
  /**
   * A callback called when an error was throw while loading the media
   */
  onError?: (error: Error) => void;
  /**
   * If true, and if there is a snapshot of the video, the snapshot will be displayed
   * During the loading of the video
   */
  useAnimationSnapshot?: boolean;
  /**
   * Define how the image should fit
   */
  fit?: ImageContentFit;
  /**
   * Define the image blur
   */
  blurRadius?: number;
};

/**
 * A component that renders an image with caching and snapshot capabilities
 * Used to display the uploaded images in the app (cover, post and images)
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
    useAnimationSnapshot,
    fit,
    blurRadius,
    ...props
  }: MediaImageRendererProps,
  ref: ForwardedRef<MediaImageRendererHandle>,
) => {
  const isReady = useRef(false);
  const sourceRef = useRef(source);
  const localFile = useLocalCachedMediaFile(source.mediaId, 'image');
  const [snapshotID, setSnapshotID] = useState(() =>
    useAnimationSnapshot ? (_imageSnapshots.get(source.mediaId) ?? null) : null,
  );
  const [thumbnail, setThumbnail] = useState(
    () => getThumbnail(source.mediaId, source.requestedSize) ?? null,
  );

  const useAnimationSnapshotRef = useRef(useAnimationSnapshot);
  useEffect(() => {
    if (__DEV__ && useAnimationSnapshot !== useAnimationSnapshotRef.current) {
      console.warn(
        'The useAnimationSnapshot prop should not change during the lifecycle of the component',
      );
    }
  }, [useAnimationSnapshot]);

  useLayoutEffect(() => {
    if (!isEqual(sourceRef.current, source)) {
      sourceRef.current = source;
      isReady.current = false;
      setThumbnail(getThumbnail(source.mediaId, source.requestedSize) ?? null);
      setSnapshotID(
        useAnimationSnapshotRef.current
          ? (_imageSnapshots.get(source.mediaId) ?? null)
          : null,
      );
    }
  }, [source]);

  const containerRef = useRef<any>(null);
  useImperativeHandle(
    ref,
    () => ({
      async snapshot() {
        if (containerRef.current) {
          _imageSnapshots.set(
            sourceRef.current.mediaId,
            await captureSnapshot(containerRef.current),
          );
        }
      },
    }),
    [],
  );

  const dispatchReady = useCallback(() => {
    if (!isReady.current) {
      isReady.current = true;
      onReadyForDisplay?.();
    }
  }, [onReadyForDisplay]);

  const cleanSnapshots = useCallback(() => {
    _imageSnapshots.delete(source.mediaId);
    setSnapshotID(null);
  }, [source.mediaId]);

  const onThumbnailLoad = useCallback(() => {
    dispatchReady();
    cleanSnapshots();
  }, [dispatchReady, cleanSnapshots]);

  const onImageLoad = useCallback(() => {
    dispatchReady();
    if (!localFile) {
      const source = sourceRef.current;
      addLoadedMedia(source.mediaId, source.requestedSize, source.uri);
    }
    setThumbnail(null);
    cleanSnapshots();
    onLoad?.();
  }, [onLoad, localFile, dispatchReady, cleanSnapshots]);

  const onErrorInner = useCallback(
    (event: ImageErrorEventData) => {
      onError?.(new Error(event.error));
    },
    [onError],
  );

  const imageSource = useMemo(() => {
    if (localFile) {
      return localFile;
    }
    return source.uri;
  }, [localFile, source]);

  const containerStyle = useMemo(
    () => [style, { overflow: 'hidden' as const }],
    [style],
  );

  return (
    <View style={containerStyle} ref={containerRef} {...props}>
      <Image
        recyclingKey={source.mediaId}
        source={imageSource}
        accessibilityRole="image"
        alt={alt}
        onLoad={onImageLoad}
        tintColor={tintColor}
        onError={onErrorInner}
        placeholderContentFit={fit ?? 'fill'}
        contentFit={fit ?? 'fill'}
        style={StyleSheet.absoluteFill}
        blurRadius={blurRadius}
      />
      {thumbnail && (
        <Image
          recyclingKey={`${source.mediaId}-thumbnail`}
          source={thumbnail}
          accessibilityRole="image"
          alt={alt}
          onLoad={onThumbnailLoad}
          tintColor={tintColor}
          onError={onErrorInner}
          placeholderContentFit={fit ?? 'fill'}
          contentFit={fit ?? 'fill'}
          style={StyleSheet.absoluteFill}
          blurRadius={blurRadius}
        />
      )}
      {snapshotID && (
        <SnapshotRenderer
          snapshotID={snapshotID}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
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

const _imageSnapshots = new Map<string, string>();
