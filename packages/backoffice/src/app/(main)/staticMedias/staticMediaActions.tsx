'use server';

import { eq, sql, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { StaticMediaTable, db, MediaTable } from '@azzapp/data/domains';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';

export const addStaticMedias = async ({
  medias,
  usage,
  resizeMode,
}: {
  medias: string[];
  usage: 'coverBackground' | 'coverForeground' | 'moduleBackground';
  resizeMode: 'center' | 'contain' | 'cover' | 'repeat';
}) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }

  return db.transaction(async trx => {
    const maxOrder = await trx
      .select({ order: sql`MAX(${StaticMediaTable.order})`.mapWith(Number) })
      .from(StaticMediaTable)
      .where(eq(StaticMediaTable.usage, usage))
      .then(rows => rows[0].order);

    await trx.delete(MediaTable).where(inArray(MediaTable.id, medias));

    const staticMedias = medias.map(
      (media, index) =>
        ({
          id: media,
          usage,
          resizeMode,
          order: maxOrder + index,
          enabled: true,
        }) as const,
    );
    await trx.insert(StaticMediaTable).values(staticMedias);
    revalidatePath(`/staticMedias`);
    return { success: true, staticMedias } as const;
  });
};

export const reorderStaticMedias = async (medias: string[]) => {
  await Promise.all(
    medias.map((mediaId, index) => {
      return db
        .update(StaticMediaTable)
        .set({ order: index })
        .where(eq(StaticMediaTable.id, mediaId));
    }),
  );
  revalidatePath(`/staticMedias`);
  return { success: true };
};

export const setStaticMediaEnabled = async (id: string, enabled: boolean) => {
  await db
    .update(StaticMediaTable)
    .set({ enabled })
    .where(eq(StaticMediaTable.id, id));

  revalidatePath(`/staticMedias`);
  return { success: true };
};
