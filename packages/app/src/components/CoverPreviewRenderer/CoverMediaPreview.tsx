import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GPUImageView,
  GPUVideoView,
  Image,
  Video,
  VideoFrame,
} from '#components/gpu';
import { isFileURL } from '#helpers/fileHelpers';
import { prefetchVideo } from '#helpers/mediaHelpers';
import type { EditionParameters } from '#components/gpu';
import type { NativeSyntheticEvent } from 'react-native';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';
import type { Subscription } from 'relay-runtime';

export type CoverMediaPreviewProps = Omit<ViewProps, 'children'> & {
  /**
   * The source media uri
   */
  uri: string;
  /**
   * The source media type
   */
  kind: 'image' | 'video' | 'videoFrame';
  /**
   * if the source media is a videoFrame, the time of the frame to display
   */
  time?: number | null;
  /**
   * if the source media is a video, the start time of the video to display
   */
  startTime?: number | null;
  /**
   * if the source media is a video, the duration time of the video to display
   */
  duration?: number | null;
  /**
   * The background color of the cover
   */
  backgroundColor?: string | null;
  /**
   * the mask image uri
   */
  maskUri?: string | null;
  /**
   * The background image uri
   */
  backgroundImageUri?: string | null;
  /**
   * The tint color of the background image
   */
  backgroundImageTintColor?: string | null;
  /**
   * Should the main image be multiplied by the background image
   */
  backgroundMultiply?: boolean | null;
  /**
   * Edition parameters to apply on the sourceMedia image
   */
  editionParameters?: EditionParameters | null;
  /**
   * Image filter to apply on the sourceMedia image
   * @type {(string | null)}
   */
  filter?: string | null;

  /**
   * Called when the GPUView starts loading the media
   */
  onLoadingStart?: () => void;

  /**
   * Called when the GPUView finishes loading the media
   */
  onLoadingEnd?: () => void;

  /**
   * Called when the GPUView fails to load the media
   */
  onLoadingError?: (error: Error | null) => void;

  /**
   * Pause the video
   */
  paused?: boolean;
};

/**
 * A component that displays a cover media preview on a GPUView
 */
const CoverMediaPreview = ({
  uri,
  kind,
  time,
  startTime,
  duration,
  backgroundColor,
  maskUri,
  backgroundImageUri,
  backgroundImageTintColor,
  backgroundMultiply,
  editionParameters,
  filter,
  paused = false,
  style,
  onLoadingStart,
  onLoadingEnd,
  onLoadingError,
  ...props
}: CoverMediaPreviewProps) => {
  const pausedOnFirstLoad = useRef(paused).current;

  useEffect(() => {
    let subscription: Subscription;
    if (uri && !isFileURL(uri) && kind === 'video' && pausedOnFirstLoad) {
      subscription = prefetchVideo(uri).subscribe({
        error: () => {
          /* ignore */
        },
      });
    }
    return () => {
      subscription?.unsubscribe();
    };
  }, [kind, pausedOnFirstLoad, uri]);

  const videoViewReadyState = useRef({
    imagesLoaded: false,
    playerReady: false,
  });

  const onVideoViewImagesLoadingStart = useCallback(() => {
    videoViewReadyState.current.imagesLoaded = false;
    onLoadingStart?.();
  }, [onLoadingStart]);

  const onVideoViewImagesLoaded = useCallback(() => {
    videoViewReadyState.current.imagesLoaded = true;
    if (videoViewReadyState.current.playerReady) {
      onLoadingEnd?.();
    }
  }, [onLoadingEnd]);

  const onPlayerStartBuffing = useCallback(() => {
    videoViewReadyState.current.playerReady = false;
    onLoadingStart?.();
  }, [onLoadingStart]);

  const [playerReady, setPlayerReady] = useState(false);
  const onProgress = useCallback(
    (event: NativeSyntheticEvent<{ currentTime: number }>) => {
      // wait the first frame to be displayed before considering the player ready
      if (event.nativeEvent.currentTime > 0.04) {
        setPlayerReady(true);
      }
    },
    [],
  );

  const onPlayerReady = useCallback(() => {
    videoViewReadyState.current.playerReady = true;
    const hasImages = !!backgroundImageUri || !!maskUri;
    if (videoViewReadyState.current.imagesLoaded || !hasImages) {
      onLoadingEnd?.();
    }
  }, [backgroundImageUri, maskUri, onLoadingEnd]);

  const loadingHandlers =
    kind === 'video'
      ? {
          onImagesLoadingStart: onVideoViewImagesLoadingStart,
          onImagesLoaded: onVideoViewImagesLoaded,
          onPlayerStartBuffing,
          onPlayerReady,
          onProgress,
          onError: onLoadingError,
        }
      : {
          onLoad: onLoadingEnd,
          onLoadStart: onLoadingStart,
          onError: onLoadingError,
        };

  const mainGPULayerProps = {
    uri,
    maskUri,
    parameters: editionParameters,
    filters: filter ? [filter] : [],
    blending: backgroundMultiply ? 'multiply' : 'none',
  } as const;

  const GPUView = kind === 'video' ? GPUVideoView : GPUImageView;

  return (
    <View style={style} {...props}>
      {kind === 'video' && (
        <GPUImageView
          {...loadingHandlers}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: backgroundColor ?? '#000' },
          ]}
        >
          {backgroundImageUri && (
            <Image
              uri={backgroundImageUri}
              tintColor={backgroundImageTintColor}
            />
          )}
          <VideoFrame {...mainGPULayerProps} time={startTime ?? 0} />
        </GPUImageView>
      )}
      {(kind !== 'video' || !paused) && (
        <GPUView
          {...loadingHandlers}
          paused={paused}
          style={[
            {
              flex: 1,
              opacity: kind !== 'video' || playerReady ? 1 : 0,
            },
            { backgroundColor: backgroundColor ?? '#FFF' },
          ]}
        >
          {backgroundImageUri && (
            <Image
              uri={backgroundImageUri}
              tintColor={backgroundImageTintColor}
            />
          )}
          {kind === 'video' ? (
            <Video
              {...mainGPULayerProps}
              startTime={startTime}
              duration={duration}
            />
          ) : kind === 'videoFrame' ? (
            <VideoFrame {...mainGPULayerProps} time={time} />
          ) : (
            <Image {...mainGPULayerProps} />
          )}
        </GPUView>
      )}
    </View>
  );
};

export default CoverMediaPreview;
