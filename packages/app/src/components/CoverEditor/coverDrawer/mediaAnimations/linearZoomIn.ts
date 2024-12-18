import { interpolate } from '@shopify/react-native-skia';
import type { MediaAnimation } from './mediaAnimations';

const linearZoomIn: MediaAnimation = progress => {
  'worklet';
  return imageInfo => {
    'worklet';
    const { matrix, width, height } = imageInfo;
    const scale = interpolate(progress, [0, 1], [1, 1.4]);

    //preTranslate  does not exist in react native
    matrix.postTranslate(-width / 2, -height / 2);
    matrix.postScale(scale, scale);
    matrix.postTranslate(width / 2, height / 2);
    return { matrix, width, height };
  };
};

export default linearZoomIn;
