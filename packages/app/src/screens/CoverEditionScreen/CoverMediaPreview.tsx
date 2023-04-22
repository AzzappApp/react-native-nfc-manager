import { forwardRef, useCallback, useRef } from 'react';
import {
  GPUImageView,
  GPUVideoView,
  Image,
  Video,
  VideoFrame,
} from '#components/gpu';
import type {
  EditionParameters,
  GPUImageViewHandle,
  GPUVideoViewHandle,
} from '#components/gpu';
import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

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
   * the foreground image uri
   */
  foregroundImageUri?: string | null;
  /**
   * The tint color of the foreground image
   */
  foregroundImageTintColor?: string | null;
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
};

/**
 * A component that displays a cover media preview on a GPUView
 */
const CoverMediaPreview = (
  {
    uri,
    kind,
    time,
    startTime,
    duration,
    backgroundColor,
    maskUri,
    backgroundImageUri,
    backgroundImageTintColor,
    foregroundImageUri,
    foregroundImageTintColor,
    backgroundMultiply,
    editionParameters,
    filter,
    style,
    onLoadingStart,
    onLoadingEnd,
    onLoadingError,
    ...props
  }: CoverMediaPreviewProps,
  viewRef: ForwardedRef<GPUImageViewHandle | GPUVideoViewHandle>,
) => {
  const GPUView = kind === 'video' ? GPUVideoView : GPUImageView;

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

  const onPlayerReady = useCallback(() => {
    videoViewReadyState.current.playerReady = true;
    const hasImages = !!backgroundImageUri || !!foregroundImageUri || !!maskUri;
    if (videoViewReadyState.current.imagesLoaded || !hasImages) {
      onLoadingEnd?.();
    }
  }, [backgroundImageUri, foregroundImageUri, maskUri, onLoadingEnd]);

  const loadingHandlers =
    kind === 'video'
      ? {
          onImagesLoadingStart: onVideoViewImagesLoadingStart,
          onImagesLoaded: onVideoViewImagesLoaded,
          onPlayerStartBuffing,
          onPlayerReady,
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

  return (
    <GPUView
      {...props}
      {...loadingHandlers}
      ref={viewRef as any}
      style={[style, backgroundColor != null && { backgroundColor }]}
    >
      {backgroundImageUri && (
        <Image uri={backgroundImageUri} tintColor={backgroundImageTintColor} />
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
      {foregroundImageUri && (
        <Image uri={foregroundImageUri} tintColor={foregroundImageTintColor} />
      )}
    </GPUView>
  );
};

export default forwardRef(CoverMediaPreview);
