import { createPicture, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { PixelRatio, type ViewProps } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { __RNSkiaVideoPrivateAPI } from '@azzapp/react-native-skia-video';
import SkiaAnimatedPictureView from '#ui/SkiaAnimatedPictureView';
import type {
  FrameDrawer,
  VideoComposition,
} from '@azzapp/react-native-skia-video';
import type { SkCanvas, SkPicture } from '@shopify/react-native-skia';

export type VideoCompositionRendererProps = Exclude<ViewProps, 'children'> & {
  composition: VideoComposition | null;
  pause?: boolean;
  drawFrame: FrameDrawer;
  width: number;
  height: number;
};

const VideoCompositionRenderer = ({
  composition,
  pause = false,
  drawFrame,
  width,
  height,
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

  const picture = useSharedValue<SkPicture | null>(null);
  const pixelRatio = PixelRatio.get();

  useFrameCallback(() => {
    'worklet';
    picture.value = createPicture(
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
      { width, height },
    );
  }, true);

  return (
    <SkiaAnimatedPictureView
      width={width}
      height={height}
      picture={picture}
      {...props}
    />
  );
};

export default VideoCompositionRenderer;
