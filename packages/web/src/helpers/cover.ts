import { getMediasByIds, type WebCard } from '@azzapp/data';
import { CLOUDINARY_BASE_URL } from '@azzapp/shared/imagesHelpers';

export const CROP = ['fit', 'lpad', 'fill'] as const;

export type Crop = (typeof CROP)[number];

export const buildCoverImageUrl = async (
  webCard: WebCard,
  options: {
    width: number;
    height: number;
    crop?: Crop | null;
  },
) => {
  const { coverMediaId } = webCard;

  const { width, height, crop } = options;

  if (coverMediaId) {
    const [media] = await getMediasByIds([coverMediaId]);

    return `${CLOUDINARY_BASE_URL}/${
      media?.kind === 'video' ? 'video' : 'image'
    }/upload${
      crop ? `/c_${crop}` : '/c_fit'
    },g_east,w_${width},h_${height},ar_1:1/${coverMediaId}.png`;
  }
  return undefined;
};
