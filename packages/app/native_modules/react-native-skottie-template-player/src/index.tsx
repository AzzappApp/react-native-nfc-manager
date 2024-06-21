import { NativeModules, Platform } from 'react-native';
import type {
  SkCanvas,
  SkImage,
  SkMatrix,
  SkRect,
} from '@shopify/react-native-skia';

const LINKING_ERROR =
  `The package 'react-native-skottie-template-player' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const SkiaSkottie = NativeModules.SkiaSkottie;

if (typeof SkiaSkottie?.install === 'function') {
  SkiaSkottie.install();
} else {
  console.error(LINKING_ERROR);
}

export type SkottieTemplatePlayer = {
  render(
    canvas: SkCanvas,
    size: SkRect,
    progress: number,
    resources?: Record<
      string,
      {
        image: SkImage;
        matrix: number[] | SkMatrix | null;
      }
    >,
  ): void;
};

type CreateSkottieTemplatePlayer = (
  source: string,
  resourcesIds: string[],
) => SkottieTemplatePlayer;

const createSkottieTemplatePlayer: CreateSkottieTemplatePlayer = (global as any)
  .SkottieTemplatePlayer_createSkottieTemplatePlayer;

export { createSkottieTemplatePlayer };
