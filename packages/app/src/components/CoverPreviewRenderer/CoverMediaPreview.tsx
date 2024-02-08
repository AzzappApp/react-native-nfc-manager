import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GPUImageView,
  GPUVideoView,
  Image,
  Video,
  VideoFrame,
  getFilterUri,
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
   * if true, a preview of the video will be displayed (thumbnail)
   * Until the video is ready to play
   *
   * @default true
   */
  videoPreview?: boolean;
  /**
   * Pause the video and the animations
   */
  paused?: boolean;
  /**
   * If true the video view won't be rendered
   * @default false
   */
  videoDisabled?: boolean;
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
   * Called when the video is ready to play (in case of video)
   */
  onVideoLoaded?: () => void;
  /**
   * Called when the GPUView fails to load the media
   */
  onProgress?: ({
    currentTime,
    duration,
  }: {
    currentTime: number;
    duration: number;
  }) => void;
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
  videoPreview = true,
  paused = false,
  videoDisabled = false,
  style,
  onLoadingStart,
  onLoadingEnd,
  onLoadingError,
  onProgress,
  onVideoLoaded,
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
  const onProgressInner = useCallback(
    (
      event: NativeSyntheticEvent<{ currentTime: number; duration: number }>,
    ) => {
      const { currentTime, duration } = event.nativeEvent;
      // wait the first frame to be displayed before considering the player ready
      if (currentTime > 0.04) {
        setPlayerReady(true);
      }
      onProgress?.({ currentTime, duration });
    },
    [onProgress],
  );

  const onPlayerReady = useCallback(() => {
    onVideoLoaded?.();
    videoViewReadyState.current.playerReady = true;
    const hasImages = !!backgroundImageUri || !!maskUri;
    if (videoViewReadyState.current.imagesLoaded || !hasImages) {
      onLoadingEnd?.();
    }
  }, [backgroundImageUri, maskUri, onLoadingEnd, onVideoLoaded]);

  const videoLoadingHandlers = {
    onImagesLoadingStart: onVideoViewImagesLoadingStart,
    onImagesLoaded: onVideoViewImagesLoaded,
    onPlayerStartBuffing,
    onPlayerReady,
    onProgress: onProgressInner,
    onError: onLoadingError,
  };

  const imageLoadingHandlers = {
    onLoad: onLoadingEnd,
    onLoadStart: onLoadingStart,
    onError: onLoadingError,
  };

  const mainGPULayerProps = {
    uri,
    maskUri,
    parameters: editionParameters,
    lutFilterUri: getFilterUri(filter),
    blending: backgroundMultiply ? 'multiply' : 'none',
  } as const;

  const GPUView = kind === 'video' ? GPUVideoView : GPUImageView;

  return (
    <View style={style} {...props}>
      {kind === 'video' && videoPreview && (
        <GPUImageView
          {...imageLoadingHandlers}
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
      {(kind !== 'video' || !videoDisabled) && (
        <GPUView
          {...(kind === 'video' ? videoLoadingHandlers : imageLoadingHandlers)}
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
            <Image
              // @ts-expect-error we had a fake prop to force a re-render with mask - see https://github.com/AzzappApp/azzapp/issues/1760
              fakeProp={`${mainGPULayerProps.uri} - ${mainGPULayerProps.maskUri}`}
              {...mainGPULayerProps}
            />
          )}
        </GPUView>
      )}
    </View>
  );
};

export default CoverMediaPreview;
