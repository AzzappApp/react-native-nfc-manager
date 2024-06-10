import { interpolate } from '@shopify/react-native-skia';
import { Easing } from 'react-native-reanimated';
import type { ImageMediaAnimation } from '../mediaAnimation';

const animate: ImageMediaAnimation = ({
  matrix,
  time,
  duration,
  width,
  height,
}) => {
  'worklet';
  //const progress = time / duration;
  const progress = Easing.in(Easing.cubic)(time / duration);
  const scale = interpolate(progress, [0, 1], [1.4, 1]);

  //preTranslate  does not exist in react native
  matrix.postTranslate(-width / 2, -height / 2);
  matrix.postScale(scale, scale);
  matrix.postTranslate(width / 2, height / 2);
};

export default {
  id: 'smoothZoomut' as const,
  animate,
};
