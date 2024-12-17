import {
  Skia,
  type SkSurface,
  type SkCanvas,
} from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { PixelRatio } from 'react-native';
import { runOnUI, useSharedValue } from 'react-native-reanimated';
import type { DerivedValue } from 'react-native-reanimated';

export const useOffScreenSurface = (width: number, height: number) => {
  const surfaceSharedValue = useSharedValue<SkSurface | null>(null);

  const pixelRatio = PixelRatio.get();
  useEffect(() => {
    runOnUI(() => {
      surfaceSharedValue.value?.dispose();
      surfaceSharedValue.value = Skia.Surface.MakeOffscreen(
        width * pixelRatio,
        height * pixelRatio,
      );
      if (!surfaceSharedValue.value) {
        console.error('Failed to create surface');
      }
    })();
  }, [surfaceSharedValue, height, pixelRatio, width]);

  return surfaceSharedValue;
};

export const drawOffScreen = (
  surfaceSharedValue: DerivedValue<SkSurface | null>,
  cb: (canvas: SkCanvas, width: number, height: number) => void,
) => {
  'worklet';
  if (!surfaceSharedValue.value) {
    return null;
  }
  const canvas = surfaceSharedValue.value.getCanvas();
  canvas.clear(Skia.Color('#00000000'));
  canvas.save();
  const width = surfaceSharedValue.value.width();
  const height = surfaceSharedValue.value.height();
  cb(canvas, width, height);
  surfaceSharedValue.value.flush();
  canvas.restore();
  return Skia.Image.MakeImageFromNativeTextureUnstable(
    surfaceSharedValue.value.getNativeTextureUnstable(),
    width,
    height,
  );
};
