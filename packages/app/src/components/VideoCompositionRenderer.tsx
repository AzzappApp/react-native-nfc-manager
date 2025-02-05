import { Canvas, Image, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef } from 'react';
import { type ViewProps } from 'react-native';
import {
  runOnUI,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { __RNSkiaVideoPrivateAPI } from '@azzapp/react-native-skia-video';
import { drawOffScreen, useOffScreenSurface } from '#helpers/skiaHelpers';
import type {
  FrameDrawer,
  VideoComposition,
} from '@azzapp/react-native-skia-video';
import type { SkImage } from '@shopify/react-native-skia';
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
    runOnUI(() => {
      framesExtractor?.prepare();
    })();
  }, [framesExtractor]);

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

  const surface = useOffScreenSurface(width, height);
  const image = useSharedValue<SkImage | null>(null);

  const widthRef = useRef(width);
  const heightRef = useRef(height);
  useEffect(() => {
    if (widthRef.current !== width || heightRef.current !== height) {
      console.error(
        'Changing width and height of VideoCompositionRenderer is not supported',
      );
    }
  }, [width, height]);

  useFrameCallback(() => {
    'worklet';
    image.value = drawOffScreen(surface, (canvas, width, height) => {
      canvas.clear(Skia.Color('#00000000'));

      if (!composition || !framesExtractor) {
        return;
      }
      const currentTime = framesExtractor.currentTime;
      const frames = framesExtractor.decodeCompositionFrames();
      drawFrame({
        context: undefined,
        canvas,
        width,
        height,
        currentTime,
        frames,
        videoComposition: composition,
      });
    });
    global.gc?.();
  }, true);

  return (
    <Canvas style={[{ width, height }, style]} {...props}>
      <Image x={0} y={0} width={width} height={height} image={image} />
    </Canvas>
  );
};

export default VideoCompositionRenderer;
