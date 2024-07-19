import { ClipOp } from '@shopify/react-native-skia';
import { Easing, interpolate } from 'react-native-reanimated';
import { easeAppearDisappear } from '../coverDrawerHelpers';
import type { CoverTextAnimation } from './coverTextAnimations';

const createSlideAnimation =
  (
    slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop',
  ): CoverTextAnimation =>
  ({ progress, paragraph, textLayer, canvas, canvasWidth }) => {
    'worklet';

    progress = easeAppearDisappear(progress, Easing.inOut(Easing.ease));
    const { width: layerWidth } = textLayer;
    const textWidth = (layerWidth * canvasWidth) / 100;

    canvas.translate(-textWidth / 2, -paragraph.getHeight() / 2);

    canvas.clipRect(
      {
        x: 0,
        y: 0,
        width: textWidth,
        height: paragraph.getHeight(),
      },
      ClipOp.Intersect,
      true,
    );

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

    paragraph.paint(
      canvas,
      interpolate(progress, [0, 0.25, 0.75, 1], [deltaX, 0, 0, deltaX]),
      interpolate(progress, [0, 0.25, 0.75, 1], [deltaY, 0, 0, deltaY]),
    );
  };

export default createSlideAnimation;
