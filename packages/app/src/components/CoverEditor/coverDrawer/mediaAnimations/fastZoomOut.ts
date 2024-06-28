import { interpolate } from '@shopify/react-native-skia';
import { Easing } from 'react-native-reanimated';
import type { MediaAnimation } from './mediaAnimations';
const fastZoomOut: MediaAnimation = progress => {
  'worklet';
  return {
    imageTransform: imageFrame => {
      'worklet';
      const { image, matrix, width, height } = imageFrame;
      progress = Easing.in(Easing.cubic)(progress);
      const scale = interpolate(progress, [0, 1], [1.4, 1]);

      matrix.postTranslate(-width / 2, -height / 2);
      matrix.postScale(scale, scale);
      matrix.postTranslate(width / 2, height / 2);
      return { image, matrix, width, height };
    },
  };
};

export default fastZoomOut;
