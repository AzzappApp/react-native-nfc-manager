import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { findNodeHandle, NativeModules, StyleSheet, View } from 'react-native';
import { DelayedActivityIndicator } from '#ui/ActivityIndicator/ActivityIndicator';
import SnapshotView, { snapshotView } from '../SnapshotView';
import MediaImageRenderer from './MediaImageRenderer';
import NativeMediaVideoRenderer from './NativeMediaVideoRenderer';
import type {
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
} from './mediasTypes';
import type { ForwardedRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';

/**
 * A native component that allows to display a video.
 * It also allows to take a snapshot of the video, which is useful in case of transition.
 */
const MediaVideoRenderer = (
  {
    alt,
    thumbnailURI,
    source,
    muted = false,
    paused = false,
    currentTime,
    onProgress,
    onEnd,
    onReadyForDisplay,
    onVideoReady,
    onError,
    videoEnabled,
    style,
    ...props
  }: MediaVideoRendererProps,
  ref: ForwardedRef<MediaVideoRendererHandle>,
) => {
  const isReadyForDisplay = useRef(false);

  const dispatchReady = useCallback(() => {
    if (!isReadyForDisplay.current) {
      isReadyForDisplay.current = true;
      onReadyForDisplay?.();
    }
  }, [onReadyForDisplay]);

  const cleanSnapshots = useCallback(() => {
    _videoSnapshots.delete(source.mediaId);
  }, [source.mediaId]);

  const [loading, setLoading] = useState(videoEnabled);

  const onVideoReadyForDisplay = useCallback(() => {
    cleanSnapshots();
    dispatchReady();
    onVideoReady?.();
    setLoading(false);
  }, [cleanSnapshots, dispatchReady, onVideoReady]);

  const onSeekComplete = useCallback(() => {
    cleanSnapshots();
  }, [cleanSnapshots]);

  const onProgressInner = useMemo(
    () =>
      onProgress
        ? (
            event: NativeSyntheticEvent<{
              currentTime: number;
              duration: number;
            }>,
          ) => onProgress?.(event.nativeEvent)
        : null,
    [onProgress],
  );

  const sourceRef = useRef(source.mediaId);
  // we need to clean the state to start loading
  // the placeholder
  if (sourceRef.current !== source.mediaId) {
    sourceRef.current = source.mediaId;
    isReadyForDisplay.current = false;
  }

  const videoRef = useRef<any>(null);
  const containerRef = useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      async getPlayerCurrentTime() {
        if (videoRef.current) {
          if (NativeModules.AZPMediaVideoRendererManager == null) {
            return null;
          }
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

  const thumbnailSource = useMemo(
    () =>
      thumbnailURI
        ? {
            uri: thumbnailURI,
            mediaId: source.mediaId,
            requestedSize: source.requestedSize,
          }
        : null,
    [source.mediaId, source.requestedSize, thumbnailURI],
  );

  const snapshotID = _videoSnapshots.get(source.mediaId);

  const containerStyle = useMemo(
    () => [style, { overflow: 'hidden' as const }],
    [style],
  );

  return (
    <View style={containerStyle} ref={containerRef} {...props}>
      {thumbnailSource && !currentTime && (
        <MediaImageRenderer
          testID="thumbnail"
          source={thumbnailSource}
          alt={alt}
          onReadyForDisplay={dispatchReady}
          style={StyleSheet.absoluteFill}
        />
      )}
      {snapshotID && (
        <SnapshotView
          clearOnUnmount
          snapshotID={snapshotID}
          style={StyleSheet.absoluteFill}
        />
      )}
      {videoEnabled ? (
        <View style={StyleSheet.absoluteFill}>
          <NativeMediaVideoRenderer
            ref={videoRef}
            source={source}
            muted={muted}
            paused={paused}
            currentTime={currentTime}
            accessibilityLabel={alt}
            // todo accessibilityRole="video"
            style={StyleSheet.absoluteFill}
            onReadyForDisplay={onVideoReadyForDisplay}
            onSeekComplete={onSeekComplete}
            onProgress={onProgressInner}
            onEnd={onEnd}
            onError={onError}
          />
        </View>
      ) : null}
      {loading && (
        <View style={styles.loadingContainer}>
          <DelayedActivityIndicator
            color="white"
            variant="video"
            delay={3000}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // without background color, the activity indicator is large
    flex: 1,
  },
});

export default forwardRef(MediaVideoRenderer);

const _videoSnapshots = new Map<string, string>();
