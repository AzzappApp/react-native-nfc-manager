import { interpolate } from '@shopify/react-native-skia';
import { Easing } from 'react-native-reanimated';
import type { MediaAnimation } from './mediaAnimations';

const softZoomOut: MediaAnimation = progress => {
  'worklet';
  return imageInfo => {
    'worklet';
    const { matrix, width, height } = imageInfo;
    progress = Easing.inOut(Easing.cubic)(progress);
    const scale = interpolate(progress, [0, 1], [1.4, 1]);

    matrix.postTranslate(-width / 2, -height / 2);
    matrix.postScale(scale, scale);
    matrix.postTranslate(width / 2, height / 2);
    return { matrix, width, height };
  };
};
export default softZoomOut;
