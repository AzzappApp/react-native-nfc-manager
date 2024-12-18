import { interpolate } from '@shopify/react-native-skia';
import type { MediaAnimation } from './mediaAnimations';

const linearZoomOut: MediaAnimation = progress => {
  'worklet';
  return imageInfo => {
    'worklet';
    const { matrix, width, height } = imageInfo;
    const scale = interpolate(progress, [0, 1], [1.4, 1]);
    matrix.postTranslate(-width / 2, -height / 2);
    matrix.postScale(scale, scale);
    matrix.postTranslate(width / 2, height / 2);
    return { matrix, width, height };
  };
};

export default linearZoomOut;
