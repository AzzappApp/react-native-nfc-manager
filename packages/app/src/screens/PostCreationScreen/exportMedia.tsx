import { exportImage, exportVideo } from '#helpers/mediaHelpers';
import type { ImageEditionParameters } from '#types';

const VIDEO_MAX_SIZE = 1280;
const IMAGE_MAX_SIZE = 2048;
const VIDEO_BIT_RATE = 3000000;

const exportMedia = ({
  uri,
  kind,
  aspectRatio,
  filter,
  editionParameters,
  removeSound = false,
  startTime,
  duration,
}: {
  uri: string;
  kind: 'image' | 'video';
  aspectRatio: number;
  filter?: string | null;
  editionParameters?: ImageEditionParameters | null;
  removeSound?: boolean;
  startTime?: number;
  duration?: number;
}): Promise<string> => {
  const maxSize = kind === 'image' ? IMAGE_MAX_SIZE : VIDEO_MAX_SIZE;
  const size = {
    width: aspectRatio >= 1 ? maxSize : maxSize * aspectRatio,
    height: aspectRatio < 1 ? maxSize : maxSize / aspectRatio,
  };
  if (kind === 'image') {
    return exportImage({
      uri,
      size,
      filters: filter ? [filter] : [],
      parameters: editionParameters ?? {},
      format: 'JPEG',
      quality: 0.8,
    });
  } else {
    return exportVideo({
      uri,
      size,
      bitRate: VIDEO_BIT_RATE,
      filters: filter ? [filter] : [],
      parameters: editionParameters ?? {},
      removeSound,
      startTime,
      duration,
    });
  }
};

export default exportMedia;
