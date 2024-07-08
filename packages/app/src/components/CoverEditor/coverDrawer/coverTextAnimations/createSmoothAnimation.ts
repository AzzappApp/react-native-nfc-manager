import { Skia } from '@shopify/react-native-skia';
import { Easing, interpolate } from 'react-native-reanimated';
import { easeAppearDisappear } from '../coverDrawerHelpers';
import type { CoverTextAnimation } from './coverTextAnimations';

const createSmoothAnimation =
  (
    slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop',
  ): CoverTextAnimation =>
  ({ progress, paragraph, textLayer, canvas, canvasWidth }) => {
    'worklet';

    progress = easeAppearDisappear(progress, Easing.inOut(Easing.ease));
    const { width: layerWidth } = textLayer;
    const textWidth = (layerWidth * canvasWidth) / 100;

    canvas.translate(-textWidth / 2, -paragraph.getHeight() / 2);

    const deltaX =
      slideDirection === 'fromLeft'
        ? -textWidth
        : slideDirection === 'fromRight'
          ? textWidth
          : 0;

    const deltaY =
      slideDirection === 'fromTop'
        ? -paragraph.getHeight()
        : slideDirection === 'fromBottom'
          ? paragraph.getHeight()
          : 0;

    const opacity = interpolate(progress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
    const paint = Skia.Paint();
    paint.setAlphaf(opacity);
    canvas.saveLayer(paint);

    paragraph.paint(
      canvas,
      interpolate(progress, [0, 0.25, 0.75, 1], [deltaX, 0, 0, 0]),
      interpolate(progress, [0, 0.25, 0.75, 1], [deltaY, 0, 0, 0]),
    );
    canvas.restore();
  };

export default createSmoothAnimation;
