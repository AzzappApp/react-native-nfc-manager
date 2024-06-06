import { Skia } from '@shopify/react-native-skia';
import type { CoverTransition } from '../coverTransitions';
import type { SkRuntimeEffect } from '@shopify/react-native-skia';

export const createTransition = (
  effect: SkRuntimeEffect | null,
  duration: number,
  extraUniforms?: number[],
): CoverTransition => {
  return ({ canvas, inShader, outShader, time, width, height }) => {
    'worklet';
    const progress = time / duration;
    const paint = Skia.Paint();
    const shader = effect?.makeShaderWithChildren(
      [progress, width, height, ...(extraUniforms ?? [])],
      [outShader, inShader],
      Skia.Matrix(),
    );
    if (!shader) {
      console.error('no shader');
      return;
    }
    paint.setShader(shader);
    canvas.drawPaint(paint);
  };
};
