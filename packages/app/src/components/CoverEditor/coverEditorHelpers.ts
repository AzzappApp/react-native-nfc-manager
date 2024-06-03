import type { MediaInfo, MediaInfoImage } from './coverEditorTypes';
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
    x: rect.x * width,
    y: rect.y * height,
    width: rect.width * width,
    height: rect.height * height,
  };
};
