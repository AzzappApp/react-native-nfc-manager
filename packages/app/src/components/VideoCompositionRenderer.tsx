import { Canvas, Skia } from '@shopify/react-native-skia';
import { SkiaViewApi } from '@shopify/react-native-skia/lib/module/views/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PixelRatio, type ViewProps } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { __RNSkiaVideoPrivateAPI } from '@azzapp/react-native-skia-video';
import type {
  FrameDrawer,
  VideoComposition,
} from '@azzapp/react-native-skia-video';
import type { SkCanvas } from '@shopify/react-native-skia';

export type VideoCompositionRendererProps = Exclude<ViewProps, 'children'> & {
  composition: VideoComposition | null;
  drawFrame: FrameDrawer;
  width: number;
  height: number;
};

const VideoCompositionRenderer = ({
  composition,
  drawFrame,
  width,
  height,
  style,
  ...props
}: VideoCompositionRendererProps) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setReady(true);
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

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
    if (framesExtractor && ready) {
      framesExtractor.play();
    }
  }, [framesExtractor, ready]);

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
    if (!framesExtractor || !nativeId.value || !ready) {
      return;
    }

    const currentTime = framesExtractor.currentTime;
    const frames = framesExtractor.decodeCompositionFrames();
    SkiaViewApi.callJsiMethod(
      nativeId.value,
      'renderToCanvas',
      (canvas: SkCanvas) => {
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
      },
    );
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

export default VideoCompositionRenderer;
