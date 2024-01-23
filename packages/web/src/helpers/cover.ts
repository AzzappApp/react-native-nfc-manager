import { getMediasByIds, type WebCard } from '@azzapp/data/domains';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { decodeMediaId } from '@azzapp/shared/imagesHelpers';

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUDNAME}`;

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
  const { coverData, cardColors } = webCard;

  const { width, height, crop } = options;

  const mediaId = coverData?.mediaId;
  if (mediaId) {
    const [media] = await getMediasByIds([mediaId]);

    return `${CLOUDINARY_BASE_URL}/${
      media?.kind === 'video' ? 'video' : 'image'
    }/upload${
      coverData.backgroundId
        ? `/u_${decodeMediaId(
            coverData.backgroundId,
          )}/fl_relative,w_1.0,e_colorize,co_rgb:${swapColor(
            coverData.backgroundPatternColor ?? '#FFF',
            cardColors,
          ).replace('#', '')},b_rgb:${swapColor(
            coverData.backgroundColor ?? 'light',
            cardColors,
          ).replace('#', '')}/fl_layer_apply`
        : ''
    }${
      coverData.foregroundId && !coverData.foregroundId.startsWith('l:')
        ? `/l_${decodeMediaId(
            coverData.foregroundId,
          )}/fl_relative,w_1.0,e_colorize,co_rgb:${swapColor(
            coverData.foregroundColor ?? '#FFF',
            cardColors,
          ).replace('#', '')}/fl_layer_apply`
        : ''
    }${
      crop ? `/c_${crop}` : '/c_fit'
    },g_east,w_${width},h_${height},ar_1:1/${decodeMediaId(mediaId)}.png`;
  }
  return undefined;
};
