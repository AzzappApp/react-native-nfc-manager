import { constructCloudinaryUrl } from '@cloudinary-util/url-loader';
import { buildCoverImageUrl } from './cover';
import type { Profile, WebCard } from '@azzapp/data';

const AVATAR_WIDTH = 720;

export const buildAvatarUrl = async (
  profile: Profile,
  webCard: WebCard | null,
) => {
  const avatarId = profile.avatarId ?? profile.logoId;
  let avatarUrl: string | null = null;
  if (avatarId) {
    avatarUrl = constructCloudinaryUrl({
      options: {
        src: avatarId,
        width: AVATAR_WIDTH,
        crop: 'fill',
        format: 'jpg',
      },
      config: {
        cloud: {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        },
      },
    });
  } else {
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
