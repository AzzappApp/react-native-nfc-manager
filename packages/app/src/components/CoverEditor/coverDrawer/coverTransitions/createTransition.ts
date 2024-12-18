import { Skia } from '@shopify/react-native-skia';
import type { CoverTransition } from './coverTransitions';
import type { SkRuntimeEffect } from '@shopify/react-native-skia';

export const createTransition = (
  effect: SkRuntimeEffect | null,
  duration: number,
  extraUniforms?: Record<string, number[] | number>,
): CoverTransition => {
  return ({
    canvas,
    inImage: inShader,
    outImage: outShader,
    time,
    width,
    height,
  }) => {
    'worklet';
    const progress = time / duration;
    const paint = Skia.Paint();
    const builder = effect ? Skia.RuntimeShaderBuilder(effect) : null;
    if (!builder) {
      console.error('no builder');
      return;
    }
    Object.entries({
      ...extraUniforms,
      progress,
      iResolution: [width, height],
    }).forEach(([key, value]) => {
      builder.setUniform(key, Array.isArray(value) ? value : [value]);
    });
    const filter = Skia.ImageFilter.MakeRuntimeShaderWithChildren(
      builder,
      ['imageOut', 'imageIn'],
      [outShader, inShader],
    );
    paint.setImageFilter(filter);
    canvas.drawPaint(paint);
  };
};
