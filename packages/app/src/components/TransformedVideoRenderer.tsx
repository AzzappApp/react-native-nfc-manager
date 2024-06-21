import { Skia } from '@shopify/react-native-skia';
import { useCallback, useMemo } from 'react';
import { Dimensions, PixelRatio, type ViewProps } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  useLutShader,
  createSingleVideoComposition,
  SINGLE_VIDEO_COMPOSITION_ITEM_ID,
  reduceVideoResolutionIfNecessary,
  scaleCropData,
  getDeviceMaxDecodingResolution,
  imageFrameFromVideoFrame,
  transformImage,
} from '#helpers/mediaEditions';
import { useVideoLocalPath } from '#helpers/mediaHelpers';
import VideoCompositionRenderer from './VideoCompositionRenderer';
import type { EditionParameters } from '#helpers/mediaEditions';
import type {
  VideoComposition,
  FrameDrawer,
} from '@azzapp/react-native-skia-video';
import type { Filter } from '@azzapp/shared/filtersHelper';

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
  const styles = useStyleSheet(styleSheet);

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

  const drawFrame = useCallback<FrameDrawer>(
    ({ canvas, frames, width, height }) => {
      'worklet';
      const frame = frames[SINGLE_VIDEO_COMPOSITION_ITEM_ID];
      if (!frame) {
        return;
      }
      const imageFrame = imageFrameFromVideoFrame(frame);
      if (!imageFrame) {
        return;
      }
      const paint = Skia.Paint();
      const cropData = editionParameters?.cropData;
      const shader = transformImage({
        imageFrame,
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
      style={styles.video}
      {...props}
    />
  );
};

const styleSheet = createStyleSheet(appearance => ({
  video: {
    backgroundColor: appearance === 'light' ? colors.grey500 : colors.black,
  },
}));

export default TransformedVideoRenderer;
