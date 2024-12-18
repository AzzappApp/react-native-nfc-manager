import { Skia } from '@shopify/react-native-skia';
import { scaleCropData } from './mediaEditionHelpers';
import {
  createImageFromVideoFrame,
  transformImage,
} from './mediasTransformations';
import type { EditionParameters } from './EditionParameters';
import type { TextureInfo } from './NativeTextureLoader';
import type {
  FrameDrawer,
  VideoComposition,
} from '@azzapp/react-native-skia-video';

export const SINGLE_VIDEO_COMPOSITION_ITEM_ID = 'video';

export const createSingleVideoComposition = (
  videoFilePath: string,
  startTime: number,
  duration: number,
  resolution?: { width: number; height: number },
): VideoComposition => ({
  duration,
  items: [
    {
      id: SINGLE_VIDEO_COMPOSITION_ITEM_ID,
      path: videoFilePath,
      compositionStartTime: 0,
      startTime,
      duration,
      resolution,
    },
  ],
});

export const createSingleVideoFrameDrawer =
  (
    editionParameters: EditionParameters | null | undefined,
    lutTexture: TextureInfo | null,
    videoScale = 1,
  ): FrameDrawer =>
  ({ canvas, frames, width, height }) => {
    'worklet';
    const frame = frames[SINGLE_VIDEO_COMPOSITION_ITEM_ID];
    if (!frame) {
      return;
    }
    const info = createImageFromVideoFrame(frame);
    if (!info) {
      return;
    }
    const imageFilter = transformImage({
      ...info,
      targetWidth: width,
      targetHeight: height,
      editionParameters: {
        ...editionParameters,
        cropData: editionParameters?.cropData
          ? scaleCropData(editionParameters.cropData, videoScale)
          : undefined,
      },
      lutTexture,
    });

    const paint = Skia.Paint();
    paint.setImageFilter(imageFilter);
    canvas.drawRect({ x: 0, y: 0, width, height }, paint);
  };
