import LRUCache from 'lru-cache';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { findNodeHandle, NativeModules, StyleSheet, View } from 'react-native';
import SnapshotView, { snapshotView } from '../SnapshotView';
import MediaImageRenderer from './MediaImageRenderer';
import NativeMediaVideoRenderer from './NativeMediaVideoRenderer';
import type {
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
} from './mediasTypes';
import type { ForwardedRef } from 'react';

const MediaVideoRenderer = (
  {
    uri,
    alt,
    thumbnailURI,
    source,
    width,
    aspectRatio,
    muted = false,
    paused = false,
    testID,
    currentTime,
    style,
    onProgress,
    onEnd,
    onReadyForDisplay,
  }: MediaVideoRendererProps,
  ref: ForwardedRef<MediaVideoRendererHandle>,
) => {
  if (typeof width === 'string') {
    console.error('Invalide `vw` size used on native media renderer');
    width = parseFloat(width.replace(/vw/g, ''));
  }

  const isReadyForDisplay = useRef(false);
  const [videoReady, setVideoReady] = useState(false);
  const [seeking, setSeeking] = useState(false);

  useEffect(() => {
    if (videoReady && currentTime != null) {
      setSeeking(true);
    }
  }, [currentTime, videoReady]);

  const dispatchReady = () => {
    if (!isReadyForDisplay.current) {
      isReadyForDisplay.current = true;
      onReadyForDisplay?.();
    }
  };

  const cleanSnapshots = () => {
    _videoSnapshots.delete(source);
  };

  const onVideoReadyForDisplay = () => {
    cleanSnapshots();
    setVideoReady(true);
    dispatchReady();
  };

  const onSeekComplete = () => {
    cleanSnapshots();
    setSeeking(false);
  };

  const sourceRef = useRef(source);
  // we need to clean the state to start loading
  // the placeholder
  if (sourceRef.current !== source) {
    setVideoReady(false);
    sourceRef.current = source;
    isReadyForDisplay.current = false;
  }

  const videoRef = useRef<any>();
  const containerRef = useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      getContainer() {
        return containerRef.current;
      },
      async getPlayerCurrentTime() {
        if (videoRef.current) {
          const data =
            await NativeModules.AZPMediaVideoRendererManager.getPlayerCurrentTime(
              findNodeHandle(videoRef.current),
            );
          return data?.currentTime ?? null;
        }
        return null;
      },
      async snapshot() {
        if (containerRef.current) {
          _videoSnapshots.set(
            sourceRef.current,
            await snapshotView(containerRef.current),
          );
        }
      },
    }),
    [],
  );

  const snapshotID = _videoSnapshots.get(source);

  return (
    <View
      style={[style, { width, aspectRatio, overflow: 'hidden' }]}
      ref={containerRef}
      testID={testID}
    >
      <NativeMediaVideoRenderer
        ref={videoRef}
        // TODO if file is purged by system problem may arise
        uri={localVideoFile.get(source) ?? uri}
        muted={muted}
        paused={paused}
        currentTime={currentTime}
        accessibilityLabel={alt}
        // todo accessibilityRole="video"
        style={StyleSheet.absoluteFill}
        onReadyForDisplay={onVideoReadyForDisplay}
        onSeekComplete={onSeekComplete}
        onProgress={onProgress}
        onEnd={onEnd}
      />
      {!videoReady && thumbnailURI && !currentTime && (
        <MediaImageRenderer
          source={source}
          alt={alt}
          aspectRatio={aspectRatio}
          width={width}
          uri={thumbnailURI}
          onReadyForDisplay={dispatchReady}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
        />
      )}
      {(!videoReady || seeking) && snapshotID && (
        <SnapshotView
          clearOnUnmount
          snapshotID={snapshotID}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
};

export default forwardRef(MediaVideoRenderer);

const localVideoFile = new LRUCache<string, string>({ max: 1000 });

export const addLocalVideo = (mediaID: string, localURI: string) => {
  localVideoFile.set(mediaID, localURI);
};

const _videoSnapshots = new Map<string, string>();
