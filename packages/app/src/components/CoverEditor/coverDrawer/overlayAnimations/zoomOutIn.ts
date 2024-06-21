import { interpolate } from '@shopify/react-native-skia';
import type { MediaAnimation } from '#components/CoverEditor/coverEditorTypes';

const zoomOutIn: MediaAnimation = progress => {
  'worklet';
  return {
    imageTransform: ({ image, height, width, matrix }) => {
      'worklet';
      const scale = interpolate(progress, [-1, 0, 1, 2], [1.4, 1, 1, 1.4]);

      //preTranslate  does not exist in react native
      matrix.postTranslate(-width / 2, -height / 2);
      matrix.postScale(scale, scale);
      matrix.postTranslate(width / 2, height / 2);

      return { image, matrix, width, height };
    },
  };
};

export default zoomOutIn;
