import * as Device from 'expo-device';
import memoize from 'lodash/memoize';
import { useMemo } from 'react';
import { Dimensions, PixelRatio } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { createSkottieTemplatePlayer } from 'react-native-skottie-template-player';
import {
  COVER_RATIO,
  LOTTIE_REPLACE_COLORS,
} from '@azzapp/shared/coverHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { extractLottieInfo, replaceColors } from '@azzapp/shared/lottieHelpers';
import { getFileExtension } from '#helpers/fileHelpers';
import {
  getDeviceMaxDecodingResolution,
  reduceVideoResolutionIfNecessary,
} from '#helpers/mediaEditions';
import {
  downloadRemoteFileToLocalCache,
  type SourceMedia,
} from '#helpers/mediaHelpers';
import { coverTransitions } from './coverDrawer';
import type { CardColors, CoverEditorState } from './coverEditorTypes';
import type { VideoCompositionItem } from '@azzapp/react-native-skia-video';
import type { LottieInfo } from '@azzapp/shared/lottieHelpers';
import type { SkRect } from '@shopify/react-native-skia';

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
  const { medias, localPaths, lottie, coverTransition } = state;

  const videoScales: Record<string, number> = {};
  const resolutions: Record<
    string,
    { width: number; height: number } | undefined
  > = {};
  for (const media of medias) {
    if (media.kind === 'video') {
      const path = localPaths[media.id];
      const { resolution, videoScale } = reduceVideoResolutionIfNecessary(
        media.width,
        media.height,
        media.rotation,
        getDeviceMaxDecodingResolution(path, maxDecoderResolution),
      );
      videoScales[media.id] = videoScale;
      resolutions[media.id] = resolution;
    }
  }

  let duration = 0;
  const items: VideoCompositionItem[] = [];
  const lottieInfo = extractLottieInfoMemoized(lottie);

  if (lottieInfo) {
    let i = 0;
    duration = lottieInfo?.duration;
    for (const media of medias) {
      const asset = lottieInfo.assetsInfos[i];
      if (!asset) {
        // something really wrong happened
        console.error("Too many medias for the template's assets");
        break;
      }
      if (media.kind === 'video') {
        const path = localPaths[media.id];
        items.push({
          id: asset.id,
          path,
          compositionStartTime: asset.startTime,
          startTime: media.timeRange.startTime,
          duration: media.timeRange.duration,
          resolution: resolutions[media.id],
        });
      }
      i++;
    }
  } else {
    const transitionDuration =
      (coverTransition && coverTransitions[coverTransition]?.duration) || 0;
    for (const media of medias) {
      duration = Math.max(0, duration - transitionDuration);
      if (media.kind === 'image') {
        duration += media.duration;
      } else {
        const { timeRange } = media;
        const path = localPaths[media.id];
        const itemDuration = timeRange.duration;
        items.push({
          id: media.id,
          path,
          startTime: timeRange.startTime,
          compositionStartTime: duration,
          duration: itemDuration,
          resolution: resolutions[media.id],
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
    medias.some(media => media.kind === 'video' || media.animation != null) ||
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
        (duration, media) =>
          duration +
          (media.kind === 'image' ? media.duration : media.timeRange.duration),
        0,
      ) -
      (state.coverTransition
        ? coverTransitions[state.coverTransition]?.duration *
          (state.medias.length - 1)
        : 0)
    );
  }
};

export const useLottieMediaDurations = (lottie?: JSON | null) => {
  return useMemo(() => {
    const lottieInfo = lottie ? extractLottieInfo(lottie) : undefined;
    return getLottieMediasDurations(lottieInfo);
  }, [lottie]);
};

export const getLottieMediasDurations = (lottie?: LottieInfo) => {
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

/**
 * Duplicates selected media items to fill all the designated slots in a media template.
 * This function ensures that the number of media items meets the required total number of slots
 * by duplicating existing media items cyclically until the total slot count is reached.
 *
 * @param totalSlots The total number of media slots that need to be filled in the template.
 * @param selectedMedias An array of media items (of generic type T) currently selected. These items can be of any type, typically strings, objects, etc.
 * @returns An array of media items of type T, where the number of items is equal to `totalSlots`. If the initial number of selected media items is less than `totalSlots`, it duplicates items from the `selectedMedias` cyclically to fill the gap.
 *
 * @example
 * Simple example:
 * ```ts
 * // Example of using duplicateMediaToFillSlots with strings as the media type.
 * const totalMediaSlots = 5;
 * const currentSelectedMedias = ['Media A', 'Media B', 'Media C'];
 * const finalMediaList = duplicateMediaToFillSlots<string>(totalMediaSlots, currentSelectedMedias);
 * console.log(finalMediaList); // Outputs: ['Media A', 'Media B', 'Media C', 'Media A', 'Media B']
 * ```
 */
export const duplicateMediaToFillSlots = (
  selectedMedias: Array<SourceMedia | null>,
  maxSelectableVideos?: number | undefined,
): Array<SourceMedia | null> => {
  const maxVideo =
    maxSelectableVideos === undefined ? 2000 : maxSelectableVideos;

  const validMedia = selectedMedias.filter(isDefined);
  const validMediaImage = validMedia.filter(m => m?.kind === 'image');
  let mediaVideoLength = validMedia.filter(m => m?.kind === 'video').length; // initial VideoCount

  let validMediaIndex = 0;
  const filledMedia = selectedMedias.map(media => {
    if (media) {
      return media;
    } else if (mediaVideoLength >= maxVideo) {
      if (validMediaImage.length === 0) {
        // It is not be possible to find media to duplicate
        return null;
      }
      // no more video available to insert, insert only images
      const mediaToInsert =
        validMediaImage[validMediaIndex++ % validMediaImage.length];
      return mediaToInsert;
    } else {
      // insert any content
      const mediaToInsert = validMedia[validMediaIndex++ % validMedia.length];
      if (mediaToInsert.kind === 'video') {
        mediaVideoLength++;
        if (mediaVideoLength >= maxVideo) {
          // find next Image in list
          const nextImage = validMedia.find(
            (m, idx) => idx > validMediaIndex && m.kind === 'image',
          );
          if (nextImage) {
            // find the index of next image in image list
            validMediaIndex = validMediaImage.findIndex(
              media => media.id === nextImage?.id,
            );
            // not found should not happen
            if (validMediaIndex === -1) {
              console.warn('next image not found, it should not happen');
              validMediaIndex = 0;
            }
          } else {
            validMediaIndex = 0;
          }
        }
      }
      return mediaToInsert;
    }
  });
  return filledMedia;
};

export const replaceURIWithLocalPath = <T extends SourceMedia>(
  media: T,
  localPaths: Record<string, string>,
) => ({
  ...media,
  uri: `file://${localPaths[media.id]}`,
});

const COVER_CACHE_DIR = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/covers`;

let checkMediaCacheDirPromise: Promise<void> | null = null;
const checkMediaCacheDir = () => {
  if (!checkMediaCacheDirPromise) {
    checkMediaCacheDirPromise = (async () => {
      if (!(await ReactNativeBlobUtil.fs.isDir(COVER_CACHE_DIR))) {
        await ReactNativeBlobUtil.fs.mkdir(COVER_CACHE_DIR);
      }
    })();
  }
  return checkMediaCacheDirPromise;
};

const copyPromises: Record<string, Promise<string | null>> = {};

const copyCoverMediaToCacheDirInternal = async (
  media: SourceMedia,
  abortSignal?: AbortSignal,
): Promise<string | null> => {
  await checkMediaCacheDir();
  const ext = getFileExtension(media.uri);
  const sanitizedId = media.id.replace(/[^a-z0-9]/gi, '_');
  const resultPath = `${COVER_CACHE_DIR}/${sanitizedId}${ext ? `.${ext}` : ''}`;
  if (await ReactNativeBlobUtil.fs.exists(resultPath)) {
    return resultPath;
  }
  let oldPath;
  if (media.uri && media.uri.startsWith('file://')) {
    oldPath = media.uri.replace('file://', '');
    if (!(await ReactNativeBlobUtil.fs.exists(oldPath))) {
      return null;
    }
  } else {
    oldPath = await downloadRemoteFileToLocalCache(media.uri, abortSignal);
    if (!oldPath) {
      return null;
    }
  }
  await ReactNativeBlobUtil.fs.cp(oldPath, resultPath);
  return resultPath;
};

export const copyCoverMediaToCacheDir = (
  media: SourceMedia,
  abortSignal?: AbortSignal,
): Promise<string | null> => {
  if (!copyPromises[media.id]) {
    copyPromises[media.id] = copyCoverMediaToCacheDirInternal(
      media,
      abortSignal,
    );
    copyPromises[media.id].finally(() => {
      delete copyPromises[media.id];
    });
  }
  return copyPromises[media.id];
};
