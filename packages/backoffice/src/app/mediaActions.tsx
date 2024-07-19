'use server';
import { createId } from '@paralleldrive/cuid2';
import { createMedia } from '@azzapp/data';
import { MODULE_IMAGES_SIZES } from '@azzapp/shared/cardModuleHelpers';
import { createPresignedUpload } from '@azzapp/shared/cloudinaryHelpers';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import { ADMIN } from '#roles';
import getCurrentUser from '#helpers/getCurrentUser';
import { currentUserHasRole } from '#helpers/roleHelpers';

export const getSignedUpload = async (
  kind: 'image' | 'video',
  assetKind?: 'cover' | 'module' | null,
) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const userId = (await getCurrentUser())?.id;
  const mediaId = createId();
  const pregeneratedSizes =
    assetKind === 'cover'
      ? COVER_ASSET_SIZES
      : assetKind === 'module'
        ? MODULE_IMAGES_SIZES
        : null;

  await createMedia({
    id: mediaId,
    kind,
    height: 0,
    width: 0,
  });
  return createPresignedUpload(
    mediaId,
    kind,
    null,
    pregeneratedSizes,
    `userId=${userId}|backoffice=true`,
  );
};
