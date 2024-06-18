import { Skia, type SkShader } from '@shopify/react-native-skia';
import { COVER_MAX_MEDIA_DURATION } from '@azzapp/shared/coverHelpers';
import {
  createImageFromNativeBuffer,
  scaleCropData,
  transformImage,
  transformVideoFrame,
} from '#helpers/mediaEditions';
import { mediaInfoIsImage } from '../coverEditorHelpers';
import coverTransitions from './coverTransitions';
import mediaAnimations from './mediaAnimations';
import type { CoverDrawerOptions } from './types';

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
      let shader: SkShader | undefined = undefined;
      if (mediaInfoIsImage(mediaInfo)) {
        const image = createImageFromNativeBuffer(images[media.uri], true);
        if (!image) {
          continue;
        }
        shader = transformImage({
          image,
          lutShader: filter ? lutShaders[filter] : null,
          editionParameters,
          animation: mediaInfo.animation
            ? {
                animateMatrix:
                  mediaAnimations[mediaInfo.animation].animateMatrix,
                time: currentTime - compositionStartTime,
                end: mediaDuration,
                start: 0,
              }
            : undefined,
          width,
          height,
        });
      } else {
        const frame = frames[media.uri];
        if (!frame?.buffer) {
          continue;
        }
        const videoScale = videoScales[media.uri] ?? 1;
        shader = transformVideoFrame({
          frame,
          lutShader: filter ? lutShaders[filter] : null,
          editionParameters: {
            ...editionParameters,
            cropData: editionParameters?.cropData
              ? scaleCropData(editionParameters.cropData, videoScale)
              : undefined,
          },
          width,
          height,
        });
      }
      if (!shader) {
        continue;
      }
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
