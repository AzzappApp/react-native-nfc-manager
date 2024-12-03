import { Canvas, Skia } from '@shopify/react-native-skia';
import { SkiaViewApi } from '@shopify/react-native-skia/src/views/api';
import { useCallback, useEffect, useMemo } from 'react';
import { PixelRatio, type ViewProps } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { __RNSkiaVideoPrivateAPI } from '@azzapp/react-native-skia-video';
import type {
  FrameDrawer,
  VideoComposition,
} from '@azzapp/react-native-skia-video';
import type { SkCanvas, SkiaDomView } from '@shopify/react-native-skia';
import type { MutableRefObject } from 'react';

export type VideoCompositionRendererProps = Exclude<ViewProps, 'children'> & {
  composition: VideoComposition | null;
  pause?: boolean;
  drawFrame: FrameDrawer;
  width: number;
  height: number;
  // This value store position on umount and restore it on mount
  restorePositionOnMountRef?: MutableRefObject<number>;
};

const VideoCompositionRenderer = ({
  composition,
  pause = false,
  drawFrame,
  width,
  height,
  style,
  restorePositionOnMountRef,
  ...props
}: VideoCompositionRendererProps) => {
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

      if (
        restorePositionOnMountRef &&
        restorePositionOnMountRef.current !== null &&
        restorePositionOnMountRef.current > 0
      ) {
        framesExtractor.seekTo(restorePositionOnMountRef.current);
        restorePositionOnMountRef.current = -1;
      }
    }
    return () => {
      if (restorePositionOnMountRef) {
        restorePositionOnMountRef.current = framesExtractor?.currentTime || 0;
      }
      framesExtractor?.dispose();
    };
  }, [framesExtractor, restorePositionOnMountRef]);

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
      opaque
    />
  );
};

export default VideoCompositionRenderer;
