import { interpolate } from 'react-native-reanimated';
import type { MediaAnimation } from '#components/CoverEditor/coverEditorTypes';

const fadeInOut: MediaAnimation = progress => {
  'worklet';
  return {
    drawTransform: (canvas, paint) => {
      'worklet';
      const opacity = interpolate(progress, [-1, 0, 1, 2], [0, 1, 1, 0]);
      paint.setAlphaf(opacity);
    },
  };
};

export default fadeInOut;
