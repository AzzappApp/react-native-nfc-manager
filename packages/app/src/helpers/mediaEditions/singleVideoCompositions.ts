import { Skia, type SkShader } from '@shopify/react-native-skia';
import {
  imageFrameFromVideoFrame,
  transformImage,
} from './mediasTransformations';
import type { EditionParameters } from './EditionParameters';
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
    editionParameters: EditionParameters | null,
    lutShader: SkShader | null,
  ): FrameDrawer =>
  ({ canvas, frames, width, height }) => {
    'worklet';
    const paint = Skia.Paint();
    const frame = frames[SINGLE_VIDEO_COMPOSITION_ITEM_ID];
    const imageFrame = imageFrameFromVideoFrame(frame);
    if (!imageFrame) {
      return;
    }
    const shader = transformImage({
      imageFrame,
      width,
      height,
      editionParameters,
      lutShader,
    });
    if (!shader) {
      return;
    }
    paint.setShader(shader);
    canvas.drawPaint(paint);
  };
