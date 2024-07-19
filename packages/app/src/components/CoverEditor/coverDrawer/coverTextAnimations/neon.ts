import { Skia } from '@shopify/react-native-skia';
import type { CoverTextAnimation } from './coverTextAnimations';

const visibleRange = [
  [0.1, 0.11],
  [0.12, 0.13],
  [0.14, 0.86],
  [0.87, 0.88],
  [0.89, 0.9],
];

const neon: CoverTextAnimation = ({
  progress,
  paragraph,
  textLayer,
  canvas,
  canvasWidth,
}) => {
  'worklet';
  const textWidth = (textLayer.width * canvasWidth) / 100;
  const visible = visibleRange.some(
    ([start, end]) => progress >= start && progress <= end,
  );
  if (!visible) {
    return;
  }
  const paint = Skia.Paint();
  canvas.saveLayer(paint);
  paragraph.paint(canvas, -textWidth / 2, -paragraph.getHeight() / 2);
  canvas.restore();
};

export default neon;
