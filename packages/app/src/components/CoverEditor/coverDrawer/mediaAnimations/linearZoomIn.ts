import { interpolate } from '@shopify/react-native-skia';
import type { MatrixAnimation } from '#components/CoverEditor/coverEditorTypes';

const animateMatrix: MatrixAnimation = ({
  matrix,
  time,
  start,
  end,
  width,
  height,
}) => {
  'worklet';
  const progress = time / (end - start);
  const scale = interpolate(progress, [0, 1], [1, 1.4]);

  //preTranslate  does not exist in react native
  matrix.postTranslate(-width / 2, -height / 2);
  matrix.postScale(scale, scale);
  matrix.postTranslate(width / 2, height / 2);
};

export default {
  id: 'linearZoomIn' as const,
  animateMatrix,
};
