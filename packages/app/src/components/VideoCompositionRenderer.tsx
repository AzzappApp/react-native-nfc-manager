import {
  Canvas,
  Skia,
  createPicture,
  drawAsImageFromPicture,
} from '@shopify/react-native-skia';
import { SkiaViewApi } from '@shopify/react-native-skia/lib/module/views/api';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import { PixelRatio, type ViewProps } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { __RNSkiaVideoPrivateAPI } from '@azzapp/react-native-skia-video';
import type {
  FrameDrawer,
  VideoComposition,
} from '@azzapp/react-native-skia-video';
import type {
  SkCanvas,
  SkImage,
  SkiaDomView,
} from '@shopify/react-native-skia';
import type { ForwardedRef } from 'react';

export type VideoCompositionRendererProps = Exclude<ViewProps, 'children'> & {
  composition: VideoComposition | null;
  pause?: boolean;
  drawFrame: FrameDrawer;
  width: number;
  height: number;
};

export type VideoCompositionRendererHandle = {
  makeSnapshot: () => Promise<SkImage | null>;
};

const VideoCompositionRenderer = (
  {
    composition,
    pause = false,
    drawFrame,
    width,
    height,
    style,
    ...props
  }: VideoCompositionRendererProps,
  forwardedRef: ForwardedRef<VideoCompositionRendererHandle>,
) => {
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
    return () => {
      framesExtractor?.dispose();
    };
  }, [framesExtractor]);

  useEffect(() => {
    if (framesExtractor) {
      if (pause) {
        framesExtractor.pause();
      } else {
        framesExtractor.play();
      }
    }
  }, [framesExtractor, pause]);

  const nativeId = useSharedValue<number | null>(null);
  const skiaViewRef = useCallback(
    (ref: SkiaDomView) => {
      nativeId.value = ref?.nativeId;
    },
    [nativeId],
  );
  const pixelRatio = PixelRatio.get();

  useImperativeHandle(
    forwardedRef,
    () => ({
      async makeSnapshot() {
        if (!framesExtractor || !nativeId.value) {
          return null;
        }
        const currentTime = framesExtractor.currentTime;
        const frames = framesExtractor.decodeCompositionFrames();

        return drawAsImageFromPicture(
          createPicture((canvas: SkCanvas) => {
            canvas.clear(Skia.Color('#00000000'));
            if (!composition) {
              return;
            }
            drawFrame({
              canvas,
              width: width * pixelRatio,
              height: height * pixelRatio,
              currentTime,
              frames,
              videoComposition: composition,
            });
          }),
          { width: width * pixelRatio, height: height * pixelRatio },
        );
      },
    }),
    [
      composition,
      drawFrame,
      framesExtractor,
      height,
      nativeId.value,
      pixelRatio,
      width,
    ],
  );

  useFrameCallback(() => {
    'worklet';
    if (!nativeId.value) {
      return;
    }

    try {
      SkiaViewApi.callJsiMethod(
        nativeId.value,
        'renderToCanvas',
        (canvas: SkCanvas) => {
          canvas.clear(Skia.Color('#00000000'));
          if (!composition || !framesExtractor) {
            return;
          }
          const currentTime = framesExtractor.currentTime;
          const frames = framesExtractor.decodeCompositionFrames();
          drawFrame({
            canvas,
            width: width * pixelRatio,
            height: height * pixelRatio,
            currentTime,
            frames,
            videoComposition: composition,
          });
        },
      );
    } catch {
      // sometimes the canvas is not ready yet
    }
  }, true);

  return (
    <Canvas
      //@ts-expect-error - `ref` is not a valid prop for Canvas
      ref={skiaViewRef}
      style={[{ width, height }, style]}
      {...props}
    />
  );
};

export default forwardRef(VideoCompositionRenderer);
