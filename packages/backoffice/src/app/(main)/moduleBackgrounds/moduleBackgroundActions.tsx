'use server';
import { createId } from '@paralleldrive/cuid2';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ModuleBackgroundTable, db } from '@azzapp/data';
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

  return createPresignedUpload(
    mediaId,
    'image',
    null,
    null,
    false,
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

  return db.transaction(async trx => {
    const maxOrder = await trx
      .select({
        order: sql`MAX(${ModuleBackgroundTable.order})`.mapWith(Number),
      })
      .from(ModuleBackgroundTable)
      .then(rows => rows[0].order);

    const moduleBackgrounds = medias.map(
      (mediaId, index) =>
        ({
          id: mediaId,
          resizeMode,
          order: maxOrder + index,
          enabled: true,
        }) as const,
    );
    await trx.insert(ModuleBackgroundTable).values(moduleBackgrounds);
    revalidatePath(`/moduleBackgrounds`);
    return { success: true, moduleBackgrounds } as const;
  });
};

export const reorderModuleBackgrounds = async (medias: string[]) => {
  await Promise.all(
    medias.map((mediaId, index) => {
      return db
        .update(ModuleBackgroundTable)
        .set({ order: index })
        .where(eq(ModuleBackgroundTable.id, mediaId));
    }),
  );
  revalidatePath(`/moduleBackgrounds`);
  return { success: true };
};

export const setModuleBackgroundEnabled = async (
  id: string,
  enabled: boolean,
) => {
  await db
    .update(ModuleBackgroundTable)
    .set({ enabled })
    .where(eq(ModuleBackgroundTable.id, id));

  revalidatePath(`/moduleBackgrounds`);
  return { success: true };
};
