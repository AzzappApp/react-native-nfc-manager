import { COVER_MAX_MEDIA_DURATION } from '@azzapp/shared/coverHelpers';
import {
  scaleCropData,
  transformImage,
  transformVideoFrame,
} from '#helpers/mediaEditions';
import { mediaInfoIsImage } from '../coverEditorHelpers';
import coverTransitions from './coverTransitions';
import type { CoverDrawerOptions } from './types';
import type { SkShader } from '@shopify/react-native-skia';

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
  const { duration: transitionDuration, drawer: transitionDrawer } =
    coverTransitions[coverTransition ?? 'none'] ?? coverTransitions.none;

  for (let i = 0; i < medias.length; i++) {
    const mediaInfo = medias[i];
    const isLast = i === medias.length - 1;
    const isFirst = i === 0;

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
        const image = images[media.uri];
        if (!image) {
          continue;
        }
        shader = transformImage({
          image,
          lutShader: filter ? lutShaders[filter] : null,
          editionParameters,
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
      let transitionTime = 0;
      if (currentTime < compositionStartTime + transitionDuration) {
        // Transition in
        transitionTime = isFirst ? 1 : currentTime - compositionStartTime;
      } else if (currentTime >= compositionEndTime - transitionDuration) {
        // Transition out
        transitionTime = isLast ? 1 : currentTime - compositionEndTime;
      } else {
        // No transition
        transitionTime = 1;
      }
      if (transitionTime === 1) {
        coverTransitions.none.drawer({
          canvas,
          shader,
          time: 0,
          width,
          height,
        });
      } else {
        transitionDrawer({
          canvas,
          shader,
          time: transitionTime,
          width,
          height,
        });
      }
    }
    duration = Math.max(0, duration - transitionDuration);
    duration += mediaDuration;
  }
};

export default coverMediasDrawer;
