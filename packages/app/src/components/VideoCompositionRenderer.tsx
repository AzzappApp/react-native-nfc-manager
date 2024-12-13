import { Canvas, Image, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef } from 'react';
import { PixelRatio, type ViewProps } from 'react-native';
import {
  runOnUI,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { __RNSkiaVideoPrivateAPI } from '@azzapp/react-native-skia-video';
import type {
  FrameDrawer,
  VideoComposition,
} from '@azzapp/react-native-skia-video';
import type { SkSurface, SkImage } from '@shopify/react-native-skia';
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

  const pixelRatio = PixelRatio.get();
  const surfaceShared = useSharedValue<SkSurface | null>(null);
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
    if (!surfaceShared.value) {
      surfaceShared.value = Skia.Surface.MakeOffscreen(
        width * pixelRatio,
        height * pixelRatio,
      );
    }
    const surface = surfaceShared.value!;
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('#00000000'));

    if (!composition || !framesExtractor) {
      return;
    }
    const currentTime = framesExtractor.currentTime;
    const frames = framesExtractor.decodeCompositionFrames();
    drawFrame({
      context: undefined,
      canvas,
      width: width * pixelRatio,
      height: height * pixelRatio,
      currentTime,
      frames,
      videoComposition: composition,
    });
    surface.flush();

    image.value = Skia.Image.MakeImageFromNativeTextureUnstable(
      surface.getNativeTextureUnstable(),
      width * pixelRatio,
      height * pixelRatio,
    );
    global.gc?.();
  }, true);

  return (
    <Canvas style={[{ width, height }, style]} {...props} opaque>
      <Image x={0} y={0} width={width} height={height} image={image} />
    </Canvas>
  );
};

export default VideoCompositionRenderer;
