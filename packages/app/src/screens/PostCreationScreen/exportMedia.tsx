import {
  POST_IMAGE_MAX_SIZE,
  POST_VIDEO_BIT_RATE,
  POST_VIDEO_MAX_SIZE,
} from '@azzapp/shared/postHelpers';
import { exportImage, exportVideo } from '#components/gpu';
import type { EditionParameters } from '#components/gpu';

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
  const maxSize = kind === 'image' ? POST_IMAGE_MAX_SIZE : POST_VIDEO_MAX_SIZE;
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
      quality: 95,
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
      bitRate: POST_VIDEO_BIT_RATE,
      removeSound,
    });
  }
  return { uri: result, size };
};

export default exportMedia;
