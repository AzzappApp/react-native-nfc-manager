'use server';

import { createMedia, createId } from '@azzapp/data';
import { encodeMediaId } from '@azzapp/service/mediaServices/imageHelpers';
import { createPresignedUpload } from '@azzapp/service/mediaServices/mediaServices';
import { ADMIN } from '#roles';
import getCurrentUser from '#helpers/getCurrentUser';
import { currentUserHasRole } from '#helpers/roleHelpers';

export const presignMedia = async (kind: 'image' | 'raw' | 'video') => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const userId = (await getCurrentUser())?.id;
  const mediaId = encodeMediaId(createId(), kind);

  if (kind !== 'raw') {
    await createMedia({
      id: mediaId,
      kind,
      height: 0,
      width: 0,
    });
  }

  const result = await createPresignedUpload(
    mediaId,
    kind,
    null,
    null,
    `userId=${userId}|backoffice=true`,
  );

  return result;
};
