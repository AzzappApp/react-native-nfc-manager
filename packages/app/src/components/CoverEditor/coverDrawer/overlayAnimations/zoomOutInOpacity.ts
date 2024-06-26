import { interpolate } from '@shopify/react-native-skia';
import { Easing } from 'react-native-reanimated';
import fadeInOut from './fadeInOut';
import type { OverlayAnimation } from '#components/CoverEditor/coverEditorTypes';

const zoomOutIn: OverlayAnimation = progress => {
  'worklet';
  progress = Easing.inOut(Easing.ease)(progress);
  return {
    ...fadeInOut(progress),
    animateCanvas(canvas, rect) {
      'worklet';
      const scale = interpolate(progress, [0, 0.25, 0.75, 1], [1.4, 1, 1, 1.4]);
      canvas.translate(rect.width / 2, rect.height / 2);
      canvas.scale(scale, scale);
      canvas.translate(-rect.width / 2, -rect.height / 2);
    },
  };
};

export default zoomOutIn;
