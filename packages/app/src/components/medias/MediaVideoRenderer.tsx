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
import { Platform, StyleSheet, View } from 'react-native';
import Video, { ViewType } from 'react-native-video';
import {
  captureSnapshot,
  SnapshotRenderer,
} from '@azzapp/react-native-snapshot-view';
import { useLocalCachedMediaFile } from '#helpers/mediaHelpers/LocalMediaCache';
import { DelayedActivityIndicator } from '#ui/ActivityIndicator/ActivityIndicator';
import MediaImageRenderer from './MediaImageRenderer';
import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native';
import type {
  OnProgressData,
  VideoRef,
  ReactVideoProps,
} from 'react-native-video';

export type MediaVideoRendererProps = ViewProps & {
  /**
   * The video alt text
   */
  alt?: string;
  /**
   * the thumbnail URI of the video to display while the video is loading
   */
  thumbnailURI?: string;
  /**
   * The source containing the uri of the media, the cacheId and the requestedSize
   */
  source: { uri: string; mediaId: string; requestedSize: number };
  /**
   * if true, the video will be paused
   */
  paused?: boolean;
  /**
   * if true, the video will be muted
   */
  muted?: boolean;
  /**
   * if set, the video will be played at the given time, (however it will loop)
   */
  currentTime?: number | null;
  /**
   * A callback called when either the video is ready to be played or
   * that the thumbnail is ready to be displayed
   */
  onReadyForDisplay?: () => void;
  /**
   * A callback called when either the video is ready to be played or
   * that the thumbnail is ready to be displayed
   */
  onVideoReady?: () => void;
  /**
   * A callback called when the video loading failed
   */
  onError?: (error: any) => void;
  /**
   * A callback called when the video has reached the end (before looping)
   */
  onEnd?: () => void;
  /**
   * A callback called while the video is playing, allowing to track the current time
   */
  onProgress?: (event: { currentTime: number; duration: number }) => void;
  /**
   * true if the video is enabled
   */
  videoEnabled?: boolean;
  /**
   * If true, and if there is a snapshot of the video, the snapshot will be displayed
   * During the loading of the video
   */
  useAnimationSnapshot?: boolean;
};

/**
 * The type of the MediaVideoRenderer ref
 */
export type MediaVideoRendererHandle = {
  /**
   * Returns the current time of the video
   */
  getPlayerCurrentTime(): Promise<number | null>;
  /**
   * Snapshots the current video frame, allowing the next time a MediaVideoRenderer is mounted
   * to display the snapshot while the video is loading
   */
  snapshot(): Promise<void>;
};

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
    videoEnabled,
    useAnimationSnapshot,
    onError,
    style,
    ...props
  }: MediaVideoRendererProps,
  ref: ForwardedRef<MediaVideoRendererHandle>,
) => {
  const isReadyForDisplay = useRef(false);
  const sourceRef = useRef(source);
  const [loading, setLoading] = useState(true);
  const localVideoFile = useLocalCachedMediaFile(source.mediaId, 'video');
  const [snapshotID, setSnapshotID] = useState(() =>
    useAnimationSnapshot ? (_videoSnapshots.get(source.mediaId) ?? null) : null,
  );

  const useAnimationSnapshotRef = useRef(useAnimationSnapshot);
  useEffect(() => {
    if (__DEV__ && useAnimationSnapshot !== useAnimationSnapshotRef.current) {
      console.warn(
        'The useAnimationSnapshot prop should not change during the lifecycle of the component',
      );
    }
  }, [useAnimationSnapshot]);

  const videoRef = useRef<VideoRef>(null);
  const containerRef = useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      async getPlayerCurrentTime() {
        if (videoRef.current) {
          return videoRef.current.getCurrentPosition().catch(() => null);
        }
        return null;
      },
      async snapshot() {
        if (containerRef.current) {
          _videoSnapshots.set(
            sourceRef.current.mediaId,
            await captureSnapshot(containerRef.current),
          );
        }
      },
    }),
    [],
  );

  useLayoutEffect(() => {
    if (!isEqual(sourceRef.current, source)) {
      sourceRef.current = source;
      isReadyForDisplay.current = false;
      setSnapshotID(
        useAnimationSnapshotRef.current
          ? (_videoSnapshots.get(source.mediaId) ?? null)
          : null,
      );
    }
  }, [source]);

  const dispatchReady = useCallback(() => {
    if (!isReadyForDisplay.current) {
      isReadyForDisplay.current = true;
      onReadyForDisplay?.();
    }
  }, [onReadyForDisplay]);

  const cleanSnapshots = useCallback(() => {
    _videoSnapshots.delete(source.mediaId);
    setSnapshotID(null);
  }, [source.mediaId]);

  const onThumbnailReadyForDisplay = dispatchReady;

  const onVideoReadyForDisplay = useCallback(() => {
    onVideoReady?.();
    dispatchReady();
    cleanSnapshots();
    setLoading(false);
  }, [dispatchReady, onVideoReady, cleanSnapshots]);

  const onPlaybackStatusUpdate = useCallback(
    (status: OnProgressData) => {
      onProgress?.({
        currentTime: status.currentTime,
        duration: status.playableDuration,
      });
    },
    [onProgress],
  );

  const onLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const videoSource: ReactVideoProps['source'] = useMemo(() => {
    const startPosition = currentTime ? currentTime * 1000 : undefined;
    if (localVideoFile) {
      return {
        uri: localVideoFile,
        startPosition,
      };
    }
    return { uri: source.uri, startPosition };
  }, [localVideoFile, source, currentTime]);

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

  const containerStyle = useMemo(
    () => [style, { overflow: 'hidden' as const }],
    [style],
  );

  // configure cache size to avoid downloading video content on every playback
  // This configuration is android only
  const bufferConfig = { cacheSizeMB: 100 };

  return (
    <View style={containerStyle} ref={containerRef} {...props}>
      {thumbnailSource && !currentTime && !snapshotID && (
        <MediaImageRenderer
          source={thumbnailSource}
          testID="thumbnail"
          alt={alt}
          onReadyForDisplay={onThumbnailReadyForDisplay}
          style={StyleSheet.absoluteFill}
        />
      )}
      {!!videoEnabled && (
        <Video
          ref={videoRef}
          source={videoSource}
          muted={muted}
          paused={paused}
          disableFocus={true}
          onProgress={onPlaybackStatusUpdate}
          preventsDisplaySleepDuringVideoPlayback={false}
          onEnd={onEnd}
          accessibilityLabel={alt}
          repeat
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          viewType={ViewType.TEXTURE}
          onReadyForDisplay={onVideoReadyForDisplay}
          playInBackground={false}
          onError={onError}
          progressUpdateInterval={onProgress ? 50 : undefined}
          hideShutterView
          shutterColor="transparent"
          onLoad={onLoadEnd}
          bufferConfig={bufferConfig}
        />
      )}
      {snapshotID && (
        <SnapshotRenderer
          snapshotID={snapshotID}
          style={StyleSheet.absoluteFill}
        />
      )}
      {loading && videoEnabled && (
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
