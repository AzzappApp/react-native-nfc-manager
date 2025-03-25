import { getMediasByIds } from '@azzapp/data';
import {
  CLOUDINARY_BASE_URL,
  DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL,
} from '@azzapp/shared/imagesHelpers';
import type { Profile, WebCard } from '@azzapp/data';

const AVATAR_WIDTH = 720;

export const CROP = ['fit', 'lpad', 'fill'] as const;

export type Crop = (typeof CROP)[number];

export const buildAvatarUrl = async (
  profile: Profile,
  webCard: WebCard | null,
  fallbackOnCover: boolean = true,
  fallbackOnCompanyLogo: boolean = true,
) => {
  const avatarId =
    profile.avatarId ?? (fallbackOnCompanyLogo ? profile.logoId : undefined);
  let avatarUrl: string | null = null;
  if (avatarId) {
    avatarUrl = `${CLOUDINARY_BASE_URL}/image/upload/c_fill,w_${AVATAR_WIDTH}/v1/${avatarId}.jpg`;
  } else if (fallbackOnCover) {
    avatarUrl = await buildCoverAvatarUrl(webCard);
  }

  return avatarUrl;
};

export const buildCoverAvatarUrl = async (webCard: WebCard | null) => {
  let avatarUrl: string | null = null;
  if (webCard?.cardIsPublished) {
    avatarUrl =
      (await buildCoverImageUrl(webCard, {
        width: AVATAR_WIDTH,
        height: AVATAR_WIDTH,
        crop: 'fill',
      })) ?? null;
  }

  return avatarUrl;
};

export const buildCoverImageUrl = async (
  webCard: WebCard,
  options: {
    width: number;
    height: number;
    crop?: Crop | null;
  },
) => {
  const { coverMediaId, coverPreviewPositionPercentage } = webCard;

  const { width, height, crop } = options;

  if (coverMediaId) {
    const [media] = await getMediasByIds([coverMediaId]);

    return `${CLOUDINARY_BASE_URL}/${
      media?.kind === 'video' ? 'video' : 'image'
    }/upload${media?.kind === 'video' ? `/so_${coverPreviewPositionPercentage ?? DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL}p` : ''}${
      crop ? `/c_${crop}` : '/c_fit'
    },g_east,w_${width},h_${height},ar_1:1/${coverMediaId}.png`;
  }
  return undefined;
};
