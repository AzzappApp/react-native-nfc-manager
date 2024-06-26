import type { SkRRect } from '@shopify/react-native-skia';

export const convertToBaseCanvasRatio = (
  value: number,
  canvasWidth: number,
) => {
  'worklet';
  return value * (canvasWidth / 300);
};

export const inflateRRect = (
  rect: SkRRect,
  dx: number,
  dy: number,
  tx = 0,
  ty = 0,
) => {
  'worklet';
  return {
    rect: {
      x: rect.rect.x - dx + tx,
      y: rect.rect.y - dy + ty,
      width: rect.rect.width + 2 * dx,
      height: rect.rect.height + 2 * dy,
    },
    rx: rect.rx + dx,
    ry: rect.ry + dy,
  };
};
