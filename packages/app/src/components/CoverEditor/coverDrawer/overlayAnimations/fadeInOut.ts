import { interpolate } from 'react-native-reanimated';
import type { OverlayAnimation } from '#components/CoverEditor/coverEditorTypes';

const fadeInOut: OverlayAnimation = progress => {
  'worklet';
  return {
    animatePaint: paint => {
      'worklet';
      const opacity = interpolate(progress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
      paint.setAlphaf(opacity);
    },
  };
};

export default fadeInOut;
