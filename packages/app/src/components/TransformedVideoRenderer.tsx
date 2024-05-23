import { Canvas, Skia } from '@shopify/react-native-skia';
import { SkiaViewApi } from '@shopify/react-native-skia/lib/module/views/api';
import { useCallback, useEffect, useMemo } from 'react';
import { PixelRatio, type ViewProps } from 'react-native';
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
  uri: string | null;
  editionParameters?: EditionParameters | null;
  filter?: Filter | null;
  startTime: number;
  duration: number;
  width: number;
  height: number;
  onLoad?: () => void;
  onError?: (error?: Error) => void;
};

const TransformedVideoRenderer = ({
  uri,
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

  const videoPath = useVideoLocalPath(uri, onLoad, onError);

  const composition = useMemo<VideoComposition | null>(() => {
    if (!videoPath) {
      return null;
    }
    return createSingleVideoComposition(videoPath, startTime, duration);
  }, [videoPath, duration, startTime]);

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
        const shader = transformVideoFrame({
          frame,
          width: width * pixelRatio,
          height: height * pixelRatio,
          editionParameters,
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
