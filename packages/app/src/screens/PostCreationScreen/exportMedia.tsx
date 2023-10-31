import {
  POST_IMAGE_MAX_SIZE,
  POST_VIDEO_BIT_RATE,
  POST_VIDEO_MAX_SIZE,
} from '@azzapp/shared/postHelpers';
import {
  FILTERS,
  exportLayersToImage,
  exportLayersToVideo,
  isFilter,
} from '#components/gpu';
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
}): Promise<{ path: string; size: { width: number; height: number } }> => {
  const maxSize = kind === 'image' ? POST_IMAGE_MAX_SIZE : POST_VIDEO_MAX_SIZE;
  const size = {
    width: aspectRatio >= 1 ? maxSize : maxSize * aspectRatio,
    height: aspectRatio < 1 ? maxSize : maxSize / aspectRatio,
  };
  let result;
  if (kind === 'image') {
    result = await exportLayersToImage({
      layers: [
        {
          kind: 'image',
          uri,
          lutFilterUri: isFilter(filter) ? FILTERS[filter] : null,
          parameters: editionParameters ?? {},
        },
      ],
      size,
      format: 'jpg',
      quality: 95,
    });
  } else {
    result = await exportLayersToVideo({
      layers: [
        {
          kind: 'video',
          uri,
          lutFilterUri: isFilter(filter) ? FILTERS[filter] : null,
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
  return { path: result, size };
};

export default exportMedia;
