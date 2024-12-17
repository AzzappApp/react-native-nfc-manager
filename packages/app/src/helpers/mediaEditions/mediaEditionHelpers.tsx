import { Platform } from 'react-native';
import * as mime from 'react-native-mime-types';
import { getDecodingCapabilitiesFor } from '@azzapp/react-native-skia-video';
import { getFileName } from '#helpers/fileHelpers';
import type { SourceMedia } from '#helpers/mediaHelpers';
import type { CropData } from './EditionParameters';

export const cropDataForAspectRatio = (
  mediaWidth: number,
  mediaHeight: number,
  aspectRatio: number,
): CropData => {
  'worklet';
  if (mediaWidth / mediaHeight > aspectRatio) {
    return {
      originX: (mediaWidth - mediaHeight * aspectRatio) / 2,
      originY: 0,
      height: mediaHeight,
      width: mediaHeight * aspectRatio,
    };
  } else {
    return {
      originX: 0,
      originY: (mediaHeight - mediaWidth / aspectRatio) / 2,
      height: mediaWidth / aspectRatio,
      width: mediaWidth,
    };
  }
};

export const reduceVideoResolutionIfNecessary = (
  videoWidth: number,
  videoHeight: number,
  rotation: number,
  maxSize: number,
) => {
  let resolution: { width: number; height: number } | undefined = undefined;
  let videoScale = 1;
  if (videoWidth > maxSize || videoHeight > maxSize) {
    const aspectRatio = videoWidth / videoHeight;
    if (aspectRatio > 1) {
      videoScale = maxSize / videoWidth;
      resolution = {
        width: maxSize,
        height: maxSize / aspectRatio,
      };
    } else {
      videoScale = maxSize / videoHeight;
      resolution = {
        width: maxSize * aspectRatio,
        height: maxSize,
      };
    }
    if (rotation === 90 || rotation === 270) {
      resolution = {
        width: resolution.height,
        height: resolution.width,
      };
    }
  }
  return { resolution, videoScale };
};

export const scaleCropData = (cropData: CropData, scale: number): CropData => {
  'worklet';
  if (scale === 1) {
    return cropData;
  }
  return Object.fromEntries(
    Object.entries(cropData).map(([key, value]) => [key, value * scale]),
  ) as CropData;
};

export const scaleCropDataIfNecessary = (
  cropData: CropData,
  media: SourceMedia,
  skImageWidth: number | null,
) => {
  if (!skImageWidth) {
    return cropData;
  }
  if (Math.abs(media.width - skImageWidth) <= 1) {
    return cropData;
  }

  const scale = skImageWidth / media.width;
  return scaleCropData(cropData, scale);
};

export const getDeviceMaxDecodingResolution = (
  videoPath: string,
  maxResolution: number,
) => {
  if (Platform.OS === 'android') {
    const mimeType = mime.lookup(getFileName(videoPath)) || 'video/avc';
    let decoderCapabilities = getDecodingCapabilitiesFor(mimeType);
    if (!decoderCapabilities && mimeType !== 'video/avc') {
      decoderCapabilities = getDecodingCapabilitiesFor('video/avc');
    }
    if (decoderCapabilities) {
      maxResolution = Math.min(
        decoderCapabilities.maxWidth,
        decoderCapabilities.maxHeight,
        maxResolution,
      );
    }
  }
  return maxResolution;
};
