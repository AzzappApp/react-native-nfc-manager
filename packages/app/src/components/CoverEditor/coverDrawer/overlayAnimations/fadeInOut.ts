import { Easing, interpolate } from 'react-native-reanimated';
import { easeAppearDisappear } from '../coverDrawerHelpers';
import type { OverlayAnimation } from './overlayAnimations';

const fadeInOut: OverlayAnimation = progress => {
  'worklet';
  progress = easeAppearDisappear(progress, Easing.inOut(Easing.ease));

  return {
    animatePaint: paint => {
      'worklet';
      const opacity = interpolate(progress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
      paint.setAlphaf(opacity);
    },
  };
};

export default fadeInOut;
