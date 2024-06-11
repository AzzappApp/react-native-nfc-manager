import { Skia } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo } from 'react';
import { Dimensions, PixelRatio, type ViewProps } from 'react-native';
import { __RNSkiaVideoPrivateAPI } from '@azzapp/react-native-skia-video';
import {
  useLutShader,
  createSingleVideoComposition,
  SINGLE_VIDEO_COMPOSITION_ITEM_ID,
  transformVideoFrame,
  reduceVideoResolutionIfNecessary,
  scaleCropData,
  getDeviceMaxDecodingResolution,
} from '#helpers/mediaEditions';
import { useVideoLocalPath } from '#helpers/mediaHelpers';
import VideoCompositionRenderer from './VideoCompositionRenderer';
import type { Filter, EditionParameters } from '#helpers/mediaEditions';
import type {
  VideoComposition,
  FrameDrawer,
} from '@azzapp/react-native-skia-video';

export type TransformedVideoRendererProps = Exclude<ViewProps, 'children'> & {
  video: {
    uri: string;
    width: number;
    height: number;
    rotation: number;
  } | null;
  editionParameters?: EditionParameters | null;
  filter?: Filter | null;
  startTime: number;
  duration: number;
  width: number;
  height: number;
  onLoad?: () => void;
  onError?: (error?: Error) => void;
};

const MAX_DISPLAY_DECODER_RESOLUTION = Math.min(
  Dimensions.get('window').width * PixelRatio.get(),
  1920,
);

const TransformedVideoRenderer = ({
  video,
  editionParameters,
  filter,
  startTime,
  duration,
  onError,
  onLoad,
  width,
  height,
  ...props
}: TransformedVideoRendererProps) => {
  const lutShader = useLutShader(filter);

  const videoPath = useVideoLocalPath(video?.uri ?? null, onLoad, onError);

  const infos = useMemo<{
    composition: VideoComposition;
    videoScale: number;
  } | null>(() => {
    if (!videoPath || !video) {
      return null;
    }
    const { height, width, rotation } = video;

    const { resolution, videoScale } = reduceVideoResolutionIfNecessary(
      width,
      height,
      rotation,
      getDeviceMaxDecodingResolution(videoPath, MAX_DISPLAY_DECODER_RESOLUTION),
    );

    return {
      composition: createSingleVideoComposition(
        videoPath,
        startTime,
        duration,
        resolution,
      ),
      videoScale,
    };
  }, [videoPath, video, startTime, duration]);

  const composition = infos?.composition ?? null;
  const videoScale = infos?.videoScale ?? 1;

  const framesExtractor = useMemo(() => {
    if (composition) {
      return __RNSkiaVideoPrivateAPI.createVideoCompositionFramesExtractor(
        composition,
      );
    }
    return null;
  }, [composition]);

  useEffect(() => {
    if (framesExtractor) {
      framesExtractor.isLooping = true;
    }
    framesExtractor?.play();
    return () => {
      framesExtractor?.dispose();
    };
  }, [framesExtractor]);

  const drawFrame = useCallback<FrameDrawer>(
    ({ canvas, frames, width, height }) => {
      'worklet';
      const frame = frames[SINGLE_VIDEO_COMPOSITION_ITEM_ID];
      if (!frame) {
        return;
      }
      const paint = Skia.Paint();
      const cropData = editionParameters?.cropData;
      const shader = transformVideoFrame({
        frame,
        width,
        height,
        editionParameters: {
          ...editionParameters,
          cropData: cropData ? scaleCropData(cropData, videoScale) : undefined,
        },
        lutShader,
      });
      if (!shader) {
        return;
      }
      if (!shader) {
        return;
      }
      paint.setShader(shader);
      canvas.drawPaint(paint);
    },
    [editionParameters, lutShader, videoScale],
  );

  return (
    <VideoCompositionRenderer
      composition={composition}
      drawFrame={drawFrame}
      width={width}
      height={height}
      {...props}
    />
  );
};

export default TransformedVideoRenderer;
