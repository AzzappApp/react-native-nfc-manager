import { createSkottieTemplatePlayer } from 'react-native-skottie-template-player';
import { LOTTIE_REPLACE_COLORS } from '@azzapp/shared/coverHelpers';
import { replaceColors } from '@azzapp/shared/lottieHelpers';
import {
  getDeviceMaxDecodingResolution,
  reduceVideoResolutionIfNecessary,
} from '#helpers/mediaEditions';
import { coverTransitions } from './coverDrawer';
import { mediaInfoIsImage } from './coverEditorHelpers';
import type {
  CardColors,
  CoverEditorState,
  TemplateInfo,
} from './coverEditorTypes';
import type { VideoCompositionItem } from '@azzapp/react-native-skia-video';

export const createCoverVideoComposition = (
  state: CoverEditorState,
  maxDecoderResolution: number,
) => {
  const { medias, videoPaths, template, coverTransition } = state;

  const videoScales: Record<string, number> = {};
  const resolutions: Record<
    string,
    { width: number; height: number } | undefined
  > = {};
  for (const mediaInfo of medias) {
    if (!mediaInfoIsImage(mediaInfo)) {
      const { media } = mediaInfo;
      const path = videoPaths[media.uri];
      const { resolution, videoScale } = reduceVideoResolutionIfNecessary(
        media.width,
        media.height,
        media.rotation,
        getDeviceMaxDecodingResolution(path, maxDecoderResolution),
      );
      videoScales[media.uri] = videoScale;
      resolutions[media.uri] = resolution;
    }
  }

  let duration = 0;
  const items: VideoCompositionItem[] = [];

  if (template) {
    let i = 0;
    duration = template.lottieInfo.duration;
    for (const mediaInfo of medias) {
      const asset = template.lottieInfo.assetsInfos[i];
      if (!asset) {
        // something really wrong happened
        console.error("Too many medias for the template's assets");
        break;
      }
      if (!mediaInfoIsImage(mediaInfo)) {
        const { media, timeRange } = mediaInfo;
        const path = videoPaths[media.uri];
        items.push({
          id: asset.id,
          path,
          compositionStartTime: asset.startTime,
          startTime: timeRange.startTime,
          duration: timeRange.duration,
          resolution: resolutions[media.uri],
        });
      }
      i++;
    }
  } else {
    const transitionDuration =
      (coverTransition && coverTransitions[coverTransition]?.duration) || 0;
    for (const mediaInfo of medias) {
      duration = Math.max(0, duration - transitionDuration);
      if (mediaInfoIsImage(mediaInfo)) {
        duration += mediaInfo.duration;
      } else {
        const { media, timeRange } = mediaInfo;
        const path = videoPaths[media.uri];
        const itemDuration = timeRange.duration;
        items.push({
          id: media.uri,
          path,
          startTime: timeRange.startTime,
          compositionStartTime: duration,
          duration: itemDuration,
          resolution: resolutions[media.uri],
        });
        duration += itemDuration;
      }
    }
  }

  return {
    composition: {
      duration,
      items,
    },
    videoScales,
  };
};

export const createCoverSkottieWithColorReplacement = (
  template: TemplateInfo | null,
  cardColors: CardColors,
) =>
  template
    ? createSkottieTemplatePlayer(
        replaceColors(
          [
            {
              sourceColor: LOTTIE_REPLACE_COLORS.dark,
              targetColor: cardColors.dark,
            },
            {
              sourceColor: LOTTIE_REPLACE_COLORS.primary,
              targetColor: cardColors.primary,
            },
            {
              sourceColor: LOTTIE_REPLACE_COLORS.light,
              targetColor: cardColors.light,
            },
          ],
          template.lottie,
        ),
        template.lottieInfo.assetsInfos.map(asset => asset.id),
      )
    : null;

export const isCoverDynamic = (state: CoverEditorState) => {
  const { template, medias, overlayLayers } = state;
  return (
    !!template ||
    medias.some(
      mediaInfo => !mediaInfoIsImage(mediaInfo) || mediaInfo.animation != null,
    ) ||
    overlayLayers.some(overlayLayer => overlayLayer.animation != null) ||
    medias.length > 1
  );
};
