import { Skia } from '@shopify/react-native-skia';
import { Easing, interpolate } from 'react-native-reanimated';
import { easeAppearDisappear } from '../coverDrawerHelpers';
import type { CoverTextAnimation } from './coverTextAnimations';

const fadeInOut: CoverTextAnimation = ({
  progress,
  paragraph,
  textLayer,
  canvas,
  canvasWidth,
}) => {
  'worklet';
  progress = easeAppearDisappear(progress, Easing.inOut(Easing.ease));

  const textWidth = (textLayer.width * canvasWidth) / 100;
  const opacity = interpolate(progress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const paint = Skia.Paint();
  paint.setAlphaf(opacity);
  canvas.saveLayer(paint);
  paragraph.paint(canvas, -textWidth / 2, -paragraph.getHeight() / 2);
};

export default fadeInOut;
