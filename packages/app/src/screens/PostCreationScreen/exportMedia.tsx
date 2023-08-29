import { exportImage, exportVideo } from '#components/gpu';
import type { EditionParameters } from '#components/gpu';

const VIDEO_MAX_SIZE = 1280;
const IMAGE_MAX_SIZE = 2048;
const VIDEO_BIT_RATE = 3000000;

const exportMedia = async ({
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
  editionParameters?: EditionParameters | null;
  removeSound?: boolean;
  startTime?: number;
  duration?: number;
}): Promise<{ uri: string; size: { width: number; height: number } }> => {
  const maxSize = kind === 'image' ? IMAGE_MAX_SIZE : VIDEO_MAX_SIZE;
  const size = {
    width: aspectRatio >= 1 ? maxSize : maxSize * aspectRatio,
    height: aspectRatio < 1 ? maxSize : maxSize / aspectRatio,
  };
  let result;
  if (kind === 'image') {
    result = await exportImage({
      layers: [
        {
          kind: 'image',
          uri,
          filters: filter ? [filter] : [],
          parameters: editionParameters ?? {},
        },
      ],
      size,
      format: 'jpg',
      quality: 0.8,
    });
  } else {
    result = await exportVideo({
      layers: [
        {
          kind: 'video',
          uri,
          filters: filter ? [filter] : [],
          parameters: editionParameters ?? {},
          startTime,
          duration,
        },
      ],
      size,
      bitRate: VIDEO_BIT_RATE,
      removeSound,
    });
  }
  return { uri: result, size };
};

export default exportMedia;
