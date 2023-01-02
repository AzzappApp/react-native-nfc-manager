import { getVideoUrlForSize } from '@azzapp/shared/lib/imagesHelpers';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import createHTMLElement from '../../helpers/createHTMLElement';
import MediaImageRenderer from './MediaImageRenderer';
import type {
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
} from './types';
import type { ForwardedRef } from 'react';

const MediaVideoRenderer = (
  {
    thumbnailURI,
    alt,
    source,
    width,
    aspectRatio,
    muted = false,
    paused = false,
    style,
    onReadyForDisplay,
    currentTime,
    onEnd,
    onProgress: onProgressProp,
  }: MediaVideoRendererProps,
  ref: ForwardedRef<MediaVideoRendererHandle>,
) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (paused) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play().catch(() => null);
    }
  }, [paused]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime ?? 0;
    }
  }, [currentTime]);

  const onEnded = () => {
    onEnd?.();
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime ?? 0;
      videoRef.current.play().catch(() => null);
    }
  };

  const onProgress = () => {
    const video = videoRef.current;
    // TODO check the validity of the conversion
    onProgressProp?.({
      nativeEvent: {
        currentTime: video?.currentTime ?? 0,
      },
    } as any);
  };

  const [ready, setReady] = useState(false);
  const onReady = () => {
    setReady(true);
    onReadyForDisplay?.();
  };
  const sourceRef = useRef(source);
  // we need to clean the state as fast as possible
  // to avoid displaying the wrong image
  if (sourceRef.current !== source) {
    setReady(false);
    sourceRef.current = source;
  }

  const containerRef = useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      getContainer() {
        return containerRef.current;
      },
      async getPlayerCurrentTime() {
        return videoRef.current?.currentTime ?? null;
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async snapshot() {},
    }),
    [],
  );

  const height =
    typeof width === 'number'
      ? width / aspectRatio
      : `calc(${width} / ${aspectRatio})`;

  const src =
    typeof width === 'number'
      ? getVideoUrlForSize(source, width, 2, aspectRatio)
      : // TODO handle max size
        getVideoUrlForSize(source, 1280);

  return (
    <View
      style={[style, { width, aspectRatio, overflow: 'hidden' }]}
      ref={containerRef}
    >
      {createHTMLElement('video', {
        ref: videoRef,
        playsInline: true,
        autoPlay: true,
        loop: false,
        muted,
        src,
        style: [style, { width, height, objectFit: 'cover' } as any],
        onEnded,
        onLoadedData: onReady,
        onProgress,
        // TODO is it the right choice for alt ?
        children: <p>{alt}</p>,
      })}
      {!ready && thumbnailURI && (
        // TODO should we use poster ?
        <MediaImageRenderer
          alt={alt}
          source={source}
          aspectRatio={aspectRatio}
          width={width}
          uri={thumbnailURI}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
        />
      )}
    </View>
  );
};

export default forwardRef(MediaVideoRenderer);

export const addLocalVideo = () => void 0;
