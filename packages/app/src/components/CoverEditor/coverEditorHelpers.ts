import type { MediaInfo, MediaInfoImage } from './coverEditorTypes';

export const mediaInfoIsImage = (
  mediaInfo: MediaInfo,
): mediaInfo is MediaInfoImage => {
  'worklet';
  return mediaInfo.media.kind === 'image';
};
