import * as Device from 'expo-device';
import { Dimensions, PixelRatio } from 'react-native';

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

const MAX_IMAGE_SIZE =
  MEMORY_SIZE < 6 ? 1280 : MEMORY_SIZE < 8 ? 1920 : undefined;

export const MAX_EXPORT_DECODER_RESOLUTION = MAX_VIDEO_SIZE;

export const MAX_DISPLAY_DECODER_RESOLUTION = Math.min(
  Dimensions.get('window').width * PixelRatio.get(),
  1920,
);
