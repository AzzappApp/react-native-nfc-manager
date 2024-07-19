import { interpolate } from '@shopify/react-native-skia';
import { Easing } from 'react-native-reanimated';
import type { MediaAnimation } from './mediaAnimations';
const smoothZoomIn: MediaAnimation = progress => {
  'worklet';
  return {
    imageTransform: imageFrame => {
      'worklet';
      const { image, matrix, width, height } = imageFrame;
      progress = Easing.in(Easing.cubic)(progress);
      const scale = interpolate(progress, [0, 1], [1, 1.4]);

      //preTranslate  does not exist in react native
      matrix.postTranslate(-width / 2, -height / 2);
      matrix.postScale(scale, scale);
      matrix.postTranslate(width / 2, height / 2);
      return { image, matrix, width, height };
    },
  };
};

export default smoothZoomIn;
