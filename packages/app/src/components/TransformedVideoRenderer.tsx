import { useMemo } from 'react';
import { type ViewProps } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  useLutTexture,
  createSingleVideoComposition,
  reduceVideoResolutionIfNecessary,
  getDeviceMaxDecodingResolution,
  createSingleVideoFrameDrawer,
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
  maxResolution?: number;
  onLoad?: () => void;
  onError?: (error?: Error) => void;
};

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
  maxResolution,
  ...props
}: TransformedVideoRendererProps) => {
  const lutTexture = useLutTexture(filter);
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
      getDeviceMaxDecodingResolution(
        videoPath,
        Math.min(maxResolution ?? 1920, 1920),
      ),
    );

    return {
      composition: createSingleVideoComposition(
        videoPath.replace('file://', ''),
        startTime,
        duration,
        resolution,
      ),
      videoScale,
    };
  }, [videoPath, video, maxResolution, startTime, duration]);

  const composition = infos?.composition ?? null;
  const videoScale = infos?.videoScale ?? 1;

  const drawFrame = useMemo<FrameDrawer>(
    () =>
      createSingleVideoFrameDrawer(editionParameters, lutTexture, videoScale),
    [editionParameters, lutTexture, videoScale],
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
