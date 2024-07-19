import { interpolate } from '@shopify/react-native-skia';
import { Easing } from 'react-native-reanimated';
import { easeAppearDisappear } from '../coverDrawerHelpers';
import type { OverlayAnimation } from './overlayAnimations';

const zoomInOut: OverlayAnimation = progress => {
  'worklet';
  progress = easeAppearDisappear(progress, Easing.inOut(Easing.ease));
  return {
    animateCanvas(canvas, rect) {
      'worklet';
      const scale = interpolate(progress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
      canvas.translate(rect.width / 2, rect.height / 2);
      canvas.scale(scale, scale);
      canvas.translate(-rect.width / 2, -rect.height / 2);
    },
  };
};

export default zoomInOut;
