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
};

export default {
  id: 'jerkyIn' as const,
  animateMatrix,
};
