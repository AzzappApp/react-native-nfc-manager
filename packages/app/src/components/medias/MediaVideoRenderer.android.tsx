import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import { useLocalCachedMediaFile } from '#helpers/mediaHelpers/AndroidLocalMediaCache';
import { DelayedActivityIndicator } from '#ui/ActivityIndicator/ActivityIndicator';
import MediaImageRenderer from './MediaImageRenderer';
import type {
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
} from './mediasTypes';
import type { ForwardedRef } from 'react';
import type {
  OnProgressData,
  VideoRef,
  ReactVideoProps,
} from 'react-native-video';

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

  const [loading, setLoading] = useState(true);

  const dispatchReady = useCallback(() => {
    if (!isReadyForDisplay.current) {
      isReadyForDisplay.current = true;
      onReadyForDisplay?.();
    }
  }, [onReadyForDisplay]);

  const onVideoReadyForDisplay = useCallback(() => {
    onVideoReady?.();
    dispatchReady();
  }, [dispatchReady, onVideoReady]);

  const sourceRef = useRef(source.mediaId);
  // we need to clean the state to start loading
  // the placeholder
  if (sourceRef.current !== source.mediaId) {
    sourceRef.current = source.mediaId;
    isReadyForDisplay.current = false;
  }

  const videoRef = useRef<VideoRef>(null);
  const containerRef = useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      async getPlayerCurrentTime() {
        if (videoRef.current) {
          return videoRef.current.getCurrentPosition();
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

  const videoSource: ReactVideoProps['source'] = useMemo(() => {
    if (localVideoFile) {
      return {
        uri: localVideoFile,
        startPosition: currentTime ?? undefined,
      };
    }
    return { uri: source.uri, startPosition: currentTime ?? undefined };
  }, [localVideoFile, source, currentTime]);

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

  const containerStyle = useMemo(
    () => [style, { overflow: 'hidden' as const }],
    [style],
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

  return (
    <View style={containerStyle} ref={containerRef} {...props}>
      <View style={StyleSheet.absoluteFill}>
        <Video
          ref={videoRef}
          source={videoEnabled ? videoSource : undefined}
          muted={muted}
          paused={paused}
          disableFocus={true}
          onProgress={onPlaybackStatusUpdate}
          onEnd={onEnd}
          accessibilityLabel={alt}
          repeat
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          onReadyForDisplay={onVideoReadyForDisplay}
          playInBackground={false}
          onError={onError}
          progressUpdateInterval={onProgress ? 50 : undefined}
          hideShutterView
          shutterColor="transparent"
          onLoad={onLoadEnd}
          renderLoader={
            thumbnailSource && (
              <MediaImageRenderer
                testID="thumbnail"
                source={thumbnailSource}
                alt={alt}
                onReadyForDisplay={dispatchReady}
                style={StyleSheet.absoluteFill}
              />
            )
          }
        />
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
