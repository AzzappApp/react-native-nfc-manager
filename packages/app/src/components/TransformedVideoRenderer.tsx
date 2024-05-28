import { Canvas, Skia } from '@shopify/react-native-skia';
import { SkiaViewApi } from '@shopify/react-native-skia/lib/module/views/api';
import { useCallback, useEffect, useMemo } from 'react';
import { Dimensions, PixelRatio, Platform, type ViewProps } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { __RNSkiaVideoPrivateAPI } from '@azzapp/react-native-skia-video';
import {
  useLutShader,
  createSingleVideoComposition,
  SINGLE_VIDEO_COMPOSITION_ITEM_ID,
  transformVideoFrame,
} from '#helpers/mediaEditions';
import { useVideoLocalPath } from '#helpers/mediaHelpers';
import type { Filter, EditionParameters } from '#helpers/mediaEditions';
import type { VideoComposition } from '@azzapp/react-native-skia-video';
import type { SkCanvas } from '@shopify/react-native-skia';

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
    let resolution: { width: number; height: number } | undefined = undefined;
    let videoScale = 1;
    if (
      Platform.OS === 'ios' &&
      (video.width > MAX_DISPLAY_DECODER_RESOLUTION ||
        video.height > MAX_DISPLAY_DECODER_RESOLUTION)
    ) {
      const aspectRatio = width / height;
      const maxResolution = MAX_DISPLAY_DECODER_RESOLUTION;
      if (aspectRatio > 1) {
        videoScale = maxResolution / width;
        resolution = {
          width: maxResolution,
          height: maxResolution / aspectRatio,
        };
      } else {
        videoScale = maxResolution / height;
        resolution = {
          width: maxResolution * aspectRatio,
          height: maxResolution,
        };
      }
      if (rotation === 90 || rotation === 270) {
        resolution = {
          width: resolution.height,
          height: resolution.width,
        };
      }
    }

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

  const nativeId = useSharedValue<number | null>(null);
  const skiaViewRef = useCallback(
    (ref: any) => {
      nativeId.value = ref?._nativeId;
    },
    [nativeId],
  );

  const pixelRatio = PixelRatio.get();
  useFrameCallback(() => {
    'worklet';
    if (!framesExtractor) {
      return;
    }

    const frames = framesExtractor.decodeCompositionFrames();
    const frame = frames[SINGLE_VIDEO_COMPOSITION_ITEM_ID];
    if (!nativeId.value || !frame) {
      return;
    }
    SkiaViewApi.callJsiMethod(
      nativeId.value,
      'renderToCanvas',
      (canvas: SkCanvas) => {
        if (!frame) {
          return;
        }
        const paint = Skia.Paint();
        const cropData = editionParameters?.cropData;
        const shader = transformVideoFrame({
          frame,
          width: width * pixelRatio,
          height: height * pixelRatio,
          editionParameters: {
            ...editionParameters,
            cropData: cropData
              ? {
                  originX: cropData.originX * videoScale,
                  originY: cropData.originY * videoScale,
                  width: cropData.width * videoScale,
                  height: cropData.height * videoScale,
                }
              : undefined,
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
    );
  }, true);

  return (
    <Canvas
      //@ts-expect-error - `ref` is not a valid prop for Canvas
      ref={skiaViewRef}
      style={[{ width, height }, props.style]}
      {...props}
    />
  );
};

export default TransformedVideoRenderer;
