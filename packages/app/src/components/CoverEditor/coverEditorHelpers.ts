import { memoize } from 'lodash';
import { createSkottieTemplatePlayer } from 'react-native-skottie-template-player';
import { LOTTIE_REPLACE_COLORS } from '@azzapp/shared/coverHelpers';
import { extractLottieInfo, replaceColors } from '@azzapp/shared/lottieHelpers';
import {
  getDeviceMaxDecodingResolution,
  reduceVideoResolutionIfNecessary,
} from '#helpers/mediaEditions';
import { coverTransitions } from './coverDrawer';
import type {
  MediaInfo,
  MediaInfoImage,
  CardColors,
  CoverEditorState,
} from './coverEditorTypes';
import type { VideoCompositionItem } from '@azzapp/react-native-skia-video';
import type { SkRect } from '@shopify/react-native-skia';

export const mediaInfoIsImage = (
  mediaInfo: MediaInfo,
): mediaInfo is MediaInfoImage => {
  'worklet';
  return mediaInfo.media.kind === 'image';
};

export const percentRectToRect = (
  rect: SkRect,
  width: number,
  height: number,
): SkRect => {
  'worklet';
  return {
    x: (rect.x * width) / 100,
    y: (rect.y * height) / 100,
    width: (rect.width * width) / 100,
    height: (rect.height * height) / 100,
  };
};

export const createCoverVideoComposition = (
  state: CoverEditorState,
  maxDecoderResolution: number,
) => {
  const { medias, videoPaths, lottie, coverTransition } = state;

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
  const lottieInfo = extractLottieInfoMemoized(lottie);

  if (lottieInfo) {
    let i = 0;
    duration = lottieInfo?.duration;
    for (const mediaInfo of medias) {
      const asset = lottieInfo.assetsInfos[i];
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
  lottie: JSON | null,
  cardColors: CardColors,
) =>
  lottie
    ? createSkottieTemplatePlayer(
        JSON.stringify(
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
            lottie,
          ),
        ),
        extractLottieInfoMemoized(lottie)?.assetsInfos.map(asset => asset.id) ??
          [],
      )
    : null;

export const isCoverDynamic = (state: CoverEditorState) => {
  const { lottie, medias, overlayLayers } = state;
  return (
    !!lottie ||
    medias.some(
      mediaInfo => !mediaInfoIsImage(mediaInfo) || mediaInfo.animation != null,
    ) ||
    overlayLayers.some(overlayLayer => overlayLayer.animation != null) ||
    medias.length > 1
  );
};

export const extractLottieInfoMemoized = memoize((lottie: JSON | null) =>
  lottie ? extractLottieInfo(lottie) : undefined,
);

export const getCoverDuration = (state: CoverEditorState) => {
  if (state.lottie) {
    return extractLottieInfoMemoized(state.lottie)?.duration ?? 0;
  } else {
    return (
      state.medias.reduce(
        (duration, mediaInfo) =>
          duration +
          (mediaInfoIsImage(mediaInfo)
            ? mediaInfo.duration
            : mediaInfo.timeRange.duration),
        0,
      ) -
      (state.coverTransition
        ? coverTransitions[state.coverTransition]?.duration *
          (state.medias.length - 1)
        : 0)
    );
  }
};
