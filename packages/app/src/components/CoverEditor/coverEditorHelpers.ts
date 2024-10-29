import * as Device from 'expo-device';
import memoize from 'lodash/memoize';
import { Dimensions, PixelRatio } from 'react-native';
import { createSkottieTemplatePlayer } from 'react-native-skottie-template-player';
import {
  COVER_RATIO,
  LOTTIE_REPLACE_COLORS,
} from '@azzapp/shared/coverHelpers';
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
import type { LottieInfo } from '@azzapp/shared/lottieHelpers';
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
  isPreview: boolean = false,
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
      duration: isPreview ? duration - 0.01 : duration,
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
  const { lottie, medias, overlayLayers, textLayers } = state;
  return (
    !!lottie ||
    medias.some(
      mediaInfo => !mediaInfoIsImage(mediaInfo) || mediaInfo.animation != null,
    ) ||
    overlayLayers.some(
      overlayLayer =>
        overlayLayer.animation != null ||
        overlayLayer.endPercentageTotal !== 100 ||
        overlayLayer.startPercentageTotal !== 0,
    ) ||
    textLayers.some(
      textLayer =>
        textLayer.animation != null ||
        textLayer.endPercentageTotal !== 100 ||
        textLayer.startPercentageTotal !== 0,
    ) ||
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

export const getLottieMediasDurations = (lottie: LottieInfo) => {
  return lottie
    ? lottie.assetsInfos.map(
        assetInfo => assetInfo.endTime - assetInfo.startTime,
      )
    : null;
};
export const calculateImageScale = <
  T extends {
    width: number;
    height: number;
    originX?: number;
    originY?: number;
  },
>(
  media: T,
): number => {
  let imageScale = 1;
  if (MAX_IMAGE_SIZE) {
    if (media.width > MAX_IMAGE_SIZE || media.height > MAX_IMAGE_SIZE) {
      const aspectRatio = media.width / media.height;
      if (aspectRatio > 1) {
        imageScale = MAX_IMAGE_SIZE / media.width;
      } else {
        imageScale = MAX_IMAGE_SIZE / media.height;
      }
    }
  }
  return imageScale;
};

const MEMORY_SIZE = (Device.totalMemory ?? 0) / Math.pow(1024, 3);

const MAX_VIDEO_SIZE = MEMORY_SIZE < 8 ? 1280 : 1920;

/**
 * Cover video bitrate
 */
export const COVER_VIDEO_BITRATE = MEMORY_SIZE < 8 ? 6000000 : 10000000;

/**
 * Cover video frame rate
 */
export const COVER_VIDEO_FRAME_RATE = 60;
/**
 * The height of the
 */
export const COVER_EXPORT_VIDEO_RESOLUTION = {
  width: MAX_VIDEO_SIZE * COVER_RATIO,
  height: MAX_VIDEO_SIZE,
};

const MAX_IMAGE_SIZE = MEMORY_SIZE < 6 ? 1280 : MEMORY_SIZE < 8 ? 1920 : 6000;

export const MAX_EXPORT_DECODER_RESOLUTION = MAX_VIDEO_SIZE;

export const MAX_DISPLAY_DECODER_RESOLUTION = Math.min(
  Dimensions.get('window').width * PixelRatio.get(),
  1920,
);

export const getMaxAllowedVideosPerCover = (hasLottie: boolean) =>
  hasLottie
    ? MEMORY_SIZE < 6
      ? 1
      : MEMORY_SIZE < 8
        ? 2
        : 3
    : MEMORY_SIZE < 6
      ? 2
      : 3;

export const calculateBoxSize = (options: {
  height: number;
  hasLabel: boolean;
  ratio: number;
  fixedItemWidth?: number;
}) => {
  const itemHeight = options.height - 12 - (options.hasLabel ? 25 : 0);
  const itemWidth = itemHeight * options.ratio;
  const width = options.fixedItemWidth ?? itemWidth + 12;

  return { itemHeight, itemWidth, width };
};
