'use server';
import { createId } from '@paralleldrive/cuid2';
import { revalidatePath } from 'next/cache';
import {
  checkMedias,
  createMedia,
  createModuleBackgrounds,
  getModuleBackgrounds,
  referencesMedias,
  transaction,
} from '@azzapp/data';
import { createPresignedUpload } from '@azzapp/shared/cloudinaryHelpers';
import { ADMIN } from '#roles';
import getCurrentUser from '#helpers/getCurrentUser';
import { currentUserHasRole } from '#helpers/roleHelpers';

export const getModuleBackgroundSignedUpload = async () => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const userId = (await getCurrentUser())?.id;
  const mediaId = createId();

  await createMedia({
    id: mediaId,
    kind: 'image',
    height: 0,
    width: 0,
  });

  return createPresignedUpload(
    mediaId,
    'image',
    null,
    null,
    `userId=${userId}|backoffice=true`,
  );
};

export const addModuleBackgrounds = async ({
  medias,
  resizeMode,
}: {
  medias: string[];
  resizeMode: 'center' | 'contain' | 'cover' | 'repeat' | 'stretch' | null;
}) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }

  await checkMedias(medias);

  return transaction(async () => {
    await referencesMedias(medias, null);

    const maxOrder = (await getModuleBackgrounds()).reduce(
      (max, { order }) => Math.max(max, order),
      0,
    );

    const moduleBackgrounds = medias.map(
      (mediaId, index) =>
        ({
          id: mediaId,
          resizeMode,
          order: maxOrder + index,
          enabled: true,
        }) as const,
    );
    await createModuleBackgrounds(moduleBackgrounds);
    revalidatePath(`/moduleBackgrounds`);
    return { success: true, moduleBackgrounds } as const;
  });
};

export const reorderModuleBackgrounds = async (medias: string[]) => {
  await reorderModuleBackgrounds(medias);
  revalidatePath(`/moduleBackgrounds`);
  return { success: true };
};

export const setModuleBackgroundEnabled = async (
  id: string,
  enabled: boolean,
) => {
  await setModuleBackgroundEnabled(id, enabled);
  revalidatePath(`/moduleBackgrounds`);
  return { success: true };
};
