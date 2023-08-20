'use server';
import { createId } from '@paralleldrive/cuid2';
import { createMedia } from '@azzapp/data/domains';
import { createPresignedUpload } from '@azzapp/shared/cloudinaryHelpers';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';

export const getSignedUpload = async (kind: 'image' | 'video') => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const mediaId = createId();
  await createMedia({
    id: mediaId,
    kind,
    height: 0,
    width: 0,
  });
  return createPresignedUpload(mediaId, kind);
};
