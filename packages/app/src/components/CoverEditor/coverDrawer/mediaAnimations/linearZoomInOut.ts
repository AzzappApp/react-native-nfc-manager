import { interpolate } from '@shopify/react-native-skia';
import type { ImageMediaAnimation } from '../mediaAnimation';

const animate: ImageMediaAnimation = ({
  matrix,
  time,
  duration,
  width,
  height,
}) => {
  'worklet';
  const progress = time / duration;
  const scale = interpolate(progress, [0, 0.5, 1], [1, 1.4, 1]);
  matrix.postTranslate(-width / 2, -height / 2);
  matrix.postScale(scale, scale);
  matrix.postTranslate(width / 2, height / 2);
};

export default {
  id: 'linearZoomInOut' as const,
  animate,
};
