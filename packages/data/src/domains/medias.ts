import { eq, inArray, sql } from 'drizzle-orm';
import { mysqlEnum, double, mysqlTable, int } from 'drizzle-orm/mysql-core';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { getMediaInfoByPublicIds } from '@azzapp/shared/cloudinaryHelpers';
import { encodeMediaId, decodeMediaId } from '@azzapp/shared/imagesHelpers';
import db, { DEFAULT_DATETIME_VALUE, cols } from './db';
import { sortEntitiesByIds } from './generic';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const MediaTable = mysqlTable('Media', {
  id: cols.mediaId('id').notNull().primaryKey(),
  kind: mysqlEnum('kind', ['image', 'video']).notNull(),
  height: double('height').notNull(),
  width: double('width').notNull(),
  refCount: int('refCount').default(0).notNull(),
  createdAt: cols
    .dateTime('createdAt')
    .notNull()
    .default(DEFAULT_DATETIME_VALUE),
});

export type Media = InferSelectModel<typeof MediaTable>;
export type NewMedia = InferInsertModel<typeof MediaTable>;

/**
 * Retrieve a list of media by their ids.
 * @param ids - The ids of the media to retrieve
 * @returns A list of media, where the order of the media matches the order of the ids
 */
export const getMediasByIds = async (
  ids: readonly string[],
  tx: DbTransaction = db,
) =>
  ids.length
    ? sortEntitiesByIds(
        ids,
        await tx
          .select()
          .from(MediaTable)
          .where(inArray(MediaTable.id, ids as string[])),
      )
    : [];

/**
 * Create a media.
 *
 * @param media - the media fields, excluding the id
 * @param tx - The query creator to use (user for transactions)
 * @returns The created media
 */
export const createMedia = async (
  newMedia: NewMedia,
  tx: DbTransaction = db,
) => {
  const { kind, id: mediaId } = newMedia;
  await tx
    .insert(MediaTable)
    .values({ ...newMedia, id: encodeMediaId(mediaId, kind) });
  return mediaId;
};

/**
 * Update a media.
 *
 * @param mediaId the id of the media to update
 * @param updates the updates to apply to the media
 * @param tx - The query creator to use (used for transactions)
 */
export const updateMedia = async (
  mediaId: string,
  updates: NewMedia,
  tx: DbTransaction = db,
) => {
  await tx.update(MediaTable).set(updates).where(eq(MediaTable.id, mediaId));
};

/**
 * Increase the ref count of a media.
 * @param id - the id of the media to increase the ref count of
 * @param tx - The query creator to use (used for transactions)
 */
export const increaseMediaRefCount = async (
  id: string,
  tx: DbTransaction = db,
) => {
  await tx
    .update(MediaTable)
    .set({ refCount: sql`${MediaTable.refCount} + 1` })
    .where(eq(MediaTable.id, id));
};

/**
 * Decrease the ref count of a media.
 * @param id - the id of the media to decrease the ref count of
 * @param tx - The query creator to use (used for transactions)
 * @returns
 */
export const decreaseMediaRefCount = async (
  id: string,
  tx: DbTransaction = db,
) => {
  await tx
    .update(MediaTable)
    .set({ refCount: sql`${MediaTable.refCount} - 1` })
    .where(eq(MediaTable.id, id));
};

/**
 * Delete a media.
 *
 * @param id - the id of the media to delete
 * @param tx - The query creator to use (user for transactions)
 * @returns The created media
 */
export const removeMedia = async (id: string, tx: DbTransaction = db) => {
  await tx.delete(MediaTable).where(eq(MediaTable.id, id));
};

/**
 * Delete multiple media.
 *
 * @param ids - the list of media ids to delete
 * @param tx - The query creator to use (user for transactions)
 * @returns The created media
 */
export const removeMedias = async (ids: string[], tx: DbTransaction = db) => {
  await tx.delete(MediaTable).where(inArray(MediaTable.id, ids));
};

/**
 * Check if medias have been registered in the database.
 * For medias that have never been registered, check their existance in cloudinary,
 * and update their information (width, height).
 *
 * > This function is should be used OUTSIDE of a transaction. since it will interact with cloudinary.
 * And might take some time to complete.
 *
 * @param ids
 */
export const checkMedias = async (mediaIds: string[]) => {
  const medias = await getMediasByIds(mediaIds);
  const notFoundMediaIds = mediaIds.filter((_, index) => !medias[index]);
  if (notFoundMediaIds.length > 0) {
    throw new Error(`Medias not found: ${notFoundMediaIds.join(', ')}`);
  }
  const newMedias = medias.filter(media => media!.refCount === 0);
  if (newMedias.length > 0) {
    const cloudinaryMedias = await getMediaInfoByPublicIds(
      newMedias.map(media => ({
        publicId: decodeMediaId(media!.id),
        kind: media!.kind,
      })),
    );

    await Promise.all(
      // TODO batch update
      cloudinaryMedias.map(cloudinaryMedia =>
        db
          .update(MediaTable)
          .set({
            width: cloudinaryMedia!.width,
            height: cloudinaryMedia!.height,
          })
          .where(
            eq(
              MediaTable.id,
              encodeMediaId(
                cloudinaryMedia!.public_id,
                cloudinaryMedia!.resource_type === 'video' ? 'video' : 'image',
              ),
            ),
          ),
      ),
    );
  }
};

/**
 * This function is used to when an entity whish to references some medias.
 * it will increase the ref count of the medias that are not already used by the entity,
 * decrease the ref count of the medias that are not used anymore by the entity.
 *
 * @param mediaIds - the list of media ids to use
 * @param previousMediaIds - the list of media ids used by the entity before the update
 * @param tx - The query creator to use (used for transactions)
 */
export const referencesMedias = async (
  mediaIds: string[],
  previousMediaIds: Array<string | null> | null,
  tx: DbTransaction = db,
) => {
  const newMediaIds = mediaIds.filter(
    mediaId => !previousMediaIds?.includes(mediaId),
  );
  const removedMediaIds = convertToNonNullArray(previousMediaIds ?? []).filter(
    mediaId => !mediaIds.includes(mediaId),
  );

  if (newMediaIds.length > 0) {
    await tx
      .update(MediaTable)
      .set({ refCount: sql`${MediaTable.refCount} + 1` })
      .where(inArray(MediaTable.id, newMediaIds));
  }

  if (removedMediaIds && removedMediaIds.length > 0) {
    await tx
      .update(MediaTable)
      .set({ refCount: sql`${MediaTable.refCount} - 1` })
      .where(inArray(MediaTable.id, removedMediaIds));
  }
};
