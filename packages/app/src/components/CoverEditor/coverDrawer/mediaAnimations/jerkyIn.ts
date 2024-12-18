import type { MediaAnimation } from './mediaAnimations';

const jerkyIn: MediaAnimation = progress => {
  'worklet';
  return imageInfo => {
    'worklet';
    const { matrix, width, height } = imageInfo;
    let scale = 1;

    if (progress < 0.2) {
      scale = 1;
    } else if (progress < 0.4) {
      scale = 1.1;
    } else if (progress < 0.6) {
      scale = 1.2;
    } else if (progress < 0.8) {
      scale = 1.3;
    } else {
      scale = 1.4;
    }

    //preTranslate  does not exist in react native
    matrix.postTranslate(-width / 2, -height / 2);
    matrix.postScale(scale, scale);
    matrix.postTranslate(width / 2, height / 2);
    return { matrix, width, height };
  };
};

export default jerkyIn;
