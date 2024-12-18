import { interpolate } from '@shopify/react-native-skia';
import { Easing } from 'react-native-reanimated';
import type { MediaAnimation } from './mediaAnimations';

const fastZoomIn: MediaAnimation = progress => {
  'worklet';
  return imageInfo => {
    'worklet';
    const { matrix, width, height } = imageInfo;
    progress = Easing.out(Easing.cubic)(progress);
    const scale = interpolate(progress, [0, 1], [1, 1.4]);

    matrix.postTranslate(-width / 2, -height / 2);
    matrix.postScale(scale, scale);
    matrix.postTranslate(width / 2, height / 2);
    return { matrix, width, height };
  };
};

export default fastZoomIn;
