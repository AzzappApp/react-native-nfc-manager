'use server';
import { createId } from '@paralleldrive/cuid2';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { StaticMediaTable, db } from '@azzapp/data';
import { createPresignedUpload } from '@azzapp/shared/cloudinaryHelpers';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { ADMIN } from '#roles';
import getCurrentUser from '#helpers/getCurrentUser';
import { currentUserHasRole } from '#helpers/roleHelpers';

export const getStaticMediaSignedUpload = async (
  fileKind: 'lottie' | 'png' | 'svg',
  usage: 'coverBackground' | 'coverForeground' | 'moduleBackground',
) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const userId = (await getCurrentUser())?.id;
  const mediaId = createId();
  const pregeneratedSizes =
    usage !== 'moduleBackground' && fileKind === 'png'
      ? COVER_ASSET_SIZES
      : null;

  return createPresignedUpload(
    mediaId,
    fileKind === 'lottie' ? 'raw' : 'image',
    null,
    pregeneratedSizes,
    false,
    `userId=${userId}|backoffice=true`,
  );
};

export const addStaticMedias = async ({
  medias,
  usage,
  resizeMode,
}: {
  medias: Array<{ kind: 'lottie' | 'png' | 'svg'; id: string }>;
  usage: 'coverBackground' | 'coverForeground' | 'moduleBackground';
  resizeMode: 'center' | 'contain' | 'cover' | 'repeat' | 'stretch' | null;
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

    const staticMedias = medias.map(
      (media, index) =>
        ({
          id: encodeMediaId(media.id, media.kind),
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
