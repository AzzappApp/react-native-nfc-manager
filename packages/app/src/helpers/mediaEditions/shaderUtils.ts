import { Skia, type SkShader } from '@shopify/react-native-skia';

export const compileEffect = (source: string) =>
  process.env.JEST_WORKER_ID ? null : Skia.RuntimeEffect?.Make(source);

export const createShaderApplier = (source: string) => {
  const effect = compileEffect(source);
  const exec = (value: number[] | number, previousShader: SkShader) => {
    'worklet';
    if (!effect) {
      return previousShader;
    }
    return effect.makeShaderWithChildren(
      Array.isArray(value) ? value : [value],
      [previousShader],
    );
  };
  exec.effect = effect;
  return exec;
};
