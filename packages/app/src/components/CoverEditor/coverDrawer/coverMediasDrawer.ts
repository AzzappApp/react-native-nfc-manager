import { Skia, type SkShader } from '@shopify/react-native-skia';
import { COVER_MAX_MEDIA_DURATION } from '@azzapp/shared/coverHelpers';
import {
  applyImageFrameTransformations,
  applyShaderTransformations,
  createImageFromNativeBuffer,
  getTransformsForEditionParameters,
  imageFrameFromImage,
  imageFrameFromVideoFrame,
  imageFrameToShaderFrame,
  scaleCropData,
} from '#helpers/mediaEditions';
import { mediaInfoIsImage } from '../coverEditorHelpers';
import coverTransitions from './coverTransitions';
import mediaAnimations from './mediaAnimations';
import type { ImageFrame } from '#helpers/mediaEditions';
import type { CoverDrawerOptions } from './coverDrawerTypes';
import type { MediaAnimation } from './mediaAnimations';

const coverMediasDrawer = ({
  canvas,
  width,
  height,
  coverEditorState: { coverTransition, medias },
  currentTime,
  images,
  lutShaders,
  frames,
  videoScales,
}: CoverDrawerOptions) => {
  'worklet';
  let duration = 0;
  const { transition, duration: transitionDuration } = (coverTransition &&
    coverTransitions[coverTransition]) || { transition: null, duration: 0 };

  let inShader: SkShader | null = null;
  let outShader: SkShader | null = null;
  let transitionTime = 0;
  for (let i = 0; i < medias.length; i++) {
    const mediaInfo = medias[i];
    const isLast = i === medias.length - 1;
    let mediaDuration: number;

    if (mediaInfoIsImage(mediaInfo)) {
      mediaDuration = mediaInfo.duration;
    } else {
      mediaDuration = mediaInfo.timeRange.duration;
    }
    mediaDuration = Math.min(mediaDuration, COVER_MAX_MEDIA_DURATION);

    const compositionStartTime = Math.max(duration - transitionDuration, 0);
    const compositionEndTime = compositionStartTime + mediaDuration;

    if (
      compositionStartTime <= currentTime &&
      currentTime < compositionEndTime
    ) {
      const { media, filter, editionParameters } = mediaInfo;
      let imageFrame: ImageFrame | null = null;
      let scale = 1;
      let animation: MediaAnimation | null = null;
      if (mediaInfoIsImage(mediaInfo)) {
        const image = createImageFromNativeBuffer(images[media.uri], true);
        if (!image) {
          continue;
        }
        imageFrame = imageFrameFromImage(image);
        animation = mediaInfo.animation
          ? mediaAnimations[mediaInfo.animation]
          : null;
      } else {
        const frame = frames[media.uri];
        scale = videoScales[media.uri] ?? 1;
        const imageFrame = imageFrameFromVideoFrame(frame);
        if (!imageFrame) {
          continue;
        }
      }
      if (!imageFrame) {
        continue;
      }

      const { imageTransformations, shaderTransformations } =
        getTransformsForEditionParameters({
          width,
          height,
          lutShader: filter ? lutShaders[filter] : null,
          editionParameters: {
            ...editionParameters,
            cropData: editionParameters?.cropData
              ? scaleCropData(editionParameters.cropData, scale)
              : undefined,
          },
        });

      if (animation) {
        const progress = (currentTime - compositionStartTime) / mediaDuration;
        const { imageTransform, shaderTransform } = animation(progress);
        if (imageTransform) {
          imageTransformations.push(imageTransform);
        }
        if (shaderTransform) {
          shaderTransformations.push(shaderTransform);
        }
      }

      const { shader } = applyShaderTransformations(
        imageFrameToShaderFrame(
          applyImageFrameTransformations(imageFrame, imageTransformations),
        ),
        shaderTransformations,
      );

      if (currentTime >= compositionEndTime - transitionDuration && !isLast) {
        outShader = shader;
        transitionTime =
          currentTime - (compositionEndTime - transitionDuration);
      } else {
        inShader = shader;
      }
    }
    duration = Math.max(0, duration - transitionDuration);
    duration += mediaDuration;
  }
  if (inShader && outShader && transition) {
    transition({
      canvas,
      inShader,
      outShader,
      time: transitionTime,
      width,
      height,
    });
  } else if (inShader) {
    const paint = Skia.Paint();
    paint.setShader(inShader);

    canvas.drawRect(
      {
        x: 0,
        y: 0,
        width,
        height,
      },
      paint,
    );
  }
};

export default coverMediasDrawer;
