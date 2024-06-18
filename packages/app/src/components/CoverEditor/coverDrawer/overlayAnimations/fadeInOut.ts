import { Skia, interpolate } from '@shopify/react-native-skia';
import type { ShaderAnimation } from '#components/CoverEditor/coverEditorTypes';

//aplying the effect on shader does not work properly, using a alhpaF on paint
// const opacityEffect = compileEffect(`
//   uniform shader image;
//   uniform float opacity;

//   float4 main(float2 uv) {
//     float4 texColor = image.eval(uv);
//     texColor.a = opacity;
//     return texColor;
//   }
// `);
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

export default {
  id: 'fadeInOut' as const,
  animateShader,
};
