import { ResizeMode, Video } from 'expo-av';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalCachedMediaFile } from '#helpers/mediaHelpers/AndroidLocalMediaCache';
import ActivityIndicator from '#ui/ActivityIndicator';
import MediaImageRenderer from './MediaImageRenderer';
import type {
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
} from './mediasTypes';
import type { AVPlaybackStatus } from 'expo-av';
import type { ForwardedRef } from 'react';

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
    onError,
    style,
    ...props
  }: MediaVideoRendererProps,
  ref: ForwardedRef<MediaVideoRendererHandle>,
) => {
  const isReadyForDisplay = useRef(false);
  const [videoReady, setVideoReady] = useState(false);

  const dispatchReady = useCallback(() => {
    if (!isReadyForDisplay.current) {
      isReadyForDisplay.current = true;
      onReadyForDisplay?.();
    }
  }, [onReadyForDisplay]);

  const onVideoReadyForDisplay = useCallback(() => {
    setVideoReady(true);
    onVideoReady?.();
    dispatchReady();
  }, [dispatchReady, onVideoReady]);

  const sourceRef = useRef(source.mediaId);
  // we need to clean the state to start loading
  // the placeholder
  if (sourceRef.current !== source.mediaId) {
    setVideoReady(false);
    sourceRef.current = source.mediaId;
    isReadyForDisplay.current = false;
  }

  const videoRef = useRef<Video>(null);
  const containerRef = useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      async getPlayerCurrentTime() {
        if (videoRef.current) {
          const status = await videoRef.current.getStatusAsync();
          return status.isLoaded === true ? status.positionMillis : null;
        }
        return null;
      },
      async snapshot() {
        console.error('snapshot is not supported on android');
      },
    }),
    [],
  );

  const localVideoFile = useLocalCachedMediaFile(source.mediaId, 'video');

  const videoSource = useMemo(() => {
    if (localVideoFile) {
      return { uri: localVideoFile };
    }
    return { uri: source.uri };
  }, [localVideoFile, source]);

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

  useEffect(() => {
    if (paused) {
      videoRef.current?.pauseAsync();
    } else if (videoReady) {
      videoRef.current?.playAsync();
    }
  }, [paused, videoEnabled, videoReady]);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        onEnd?.();
      }

      if (status.isLoaded && status.durationMillis) {
        onProgress?.({
          currentTime: status.positionMillis / 1000,
          duration: status.durationMillis / 1000,
        });
      }
    },
    [onEnd, onProgress],
  );

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
      {videoEnabled && (
        <View style={StyleSheet.absoluteFill}>
          <Video
            ref={videoRef}
            source={videoSource}
            isMuted={muted}
            positionMillis={currentTime ?? undefined}
            accessibilityLabel={alt}
            isLooping
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.CONTAIN}
            onReadyForDisplay={onVideoReadyForDisplay}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onError={onError}
            progressUpdateIntervalMillis={onProgress ? 50 : undefined}
          >
            <ActivityIndicator color="white" />
          </Video>
        </View>
      )}
    </View>
  );
};

export default forwardRef(MediaVideoRenderer);
