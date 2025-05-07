'use server';
import { revalidatePath } from 'next/cache';
import {
  createModuleBackgrounds,
  getModuleBackgrounds,
  referencesMedias,
  transaction,
} from '@azzapp/data';
import { checkMedias } from '@azzapp/service/mediaServices/mediaServices';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';

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
