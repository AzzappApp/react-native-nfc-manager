import { Skia, interpolate } from '@shopify/react-native-skia';
import type {
  MatrixAnimation,
  ShaderAnimation,
} from '#components/CoverEditor/coverEditorTypes';

const animateShader: ShaderAnimation = ({ shader, time, start, end }) => {
  'worklet';
  //fade in animation as a entry animation from 0 => 1 on 25% start ot the duration
  if (time < start && time > end) {
    const paint = Skia.Paint();
    paint.setShader(shader);
    return paint;
  }
  const overlayDuration = end - start;
  const opacity = interpolate(
    time,
    [
      start,
      start + overlayDuration * 0.25,
      start + overlayDuration * 0.75,
      end,
    ],
    [0, 1, 1, 0],
  );

  const paint = Skia.Paint();
  paint.setShader(shader);
  paint.setAlphaf(opacity);
  return paint;
};

const animateMatrix: MatrixAnimation = ({
  matrix,
  time,
  start,
  end,
  width,
  height,
}) => {
  'worklet';
  if (time < start && time > end) {
    return;
  }
  const overlayDuration = end - start;
  const scale = interpolate(
    time,
    [
      start,
      start + overlayDuration * 0.25,
      start + overlayDuration * 0.75,
      end,
    ],
    [0.6, 1, 1, 1.4],
  );

  //preTranslate  does not exist in react native
  matrix.postTranslate(-width / 2, -height / 2);
  matrix.postScale(scale, scale);
  matrix.postTranslate(width / 2, height / 2);
};

export default {
  id: 'zoomInOpacity' as const,
  animateShader,
  animateMatrix,
};
