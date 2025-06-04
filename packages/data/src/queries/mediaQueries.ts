import { eq, inArray, sql, asc } from 'drizzle-orm';
import { db } from '../database';
import { MediaTable } from '../schema';
import { getEntitiesByIds } from './entitiesQueries';
import type { Media } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieve a list of medias by their ids.
 *
 * @param ids - The ids of the Media to retrieve
 * @returns
 *  An array corresponding to the ids provided with for each index
 *  the corresponding module background if it exists
 */
export const getMediasByIds = async (
  ids: readonly string[],
): Promise<Array<Media | null>> => getEntitiesByIds('Media', ids);

/**
 * Create a media.
 *
 * @param newMedia - the media to create
 * @returns The id of the created media
 */
export const createMedia = (newMedia: InferInsertModel<typeof MediaTable>) =>
  db()
    .insert(MediaTable)
    .values(newMedia)
    .$returningId()
    .then(() => newMedia.id);

/**
 * Update a media.
 *
 * @param mediaId the id of the media to update
 * @param updates the updates to apply to the media
 */
export const updateMedia = async (
  mediaId: string,
  updates: Partial<Omit<Media, 'id'>>,
) => {
  await db().update(MediaTable).set(updates).where(eq(MediaTable.id, mediaId));
};

/**
 * Delete a media.
 *
 * @param id - the id of the media to delete
 * @param db() - The query creator to use (user for transactions)
 * @returns The created media
 */
export const removeMedia = async (id: string) => {
  await db().delete(MediaTable).where(eq(MediaTable.id, id));
};

/**
 * Delete multiple media.
 *
 * @param ids - the list of media ids to delete
 * @returns The created media
 */
export const removeMedias = async (ids: string[]) => {
  await db().delete(MediaTable).where(inArray(MediaTable.id, ids));
};

/**
 * This function is used to when an entity whish to references a list of Media.
 * it will increase the ref count of the Media that are not already referenced by the entity,
 * and decrease the ref count of the medias that are not used anymore by the entity.
 *
 * @param mediaIds - the list of media ids that the entity will reference
 * @param previousMediaIds - the list of media ids that the entity was referencing before
 */
export const referencesMedias = async (
  mediaIds: string[],
  previousMediaIds: Array<string | null> | null,
) => {
  const newMediaIds = mediaIds.filter(
    mediaId => !previousMediaIds?.includes(mediaId),
  );
  const removedMediaIds =
    previousMediaIds
      ?.filter(mediaId => mediaId && !mediaIds.includes(mediaId))
      ?.filter(mediaId => mediaId !== null && mediaId !== undefined) ?? [];

  if (newMediaIds.length > 0) {
    await db()
      .update(MediaTable)
      .set({ refCount: sql`${MediaTable.refCount} + 1` })
      .where(inArray(MediaTable.id, newMediaIds));
  }

  if (removedMediaIds && removedMediaIds.length > 0) {
    await db()
      .update(MediaTable)
      .set({ refCount: sql`${MediaTable.refCount} - 1` })
      .where(inArray(MediaTable.id, removedMediaIds));
  }
};

export const getUnusedMedias = async (limit: number) => {
  return db()
    .select()
    .from(MediaTable)
    .where(eq(MediaTable.refCount, 0))
    .orderBy(asc(MediaTable.createdAt))
    .limit(limit);
};

export const updateMediaSize = async (
  mediaId: string,
  width: number,
  height: number,
) => {
  return db()
    .update(MediaTable)
    .set({
      width,
      height,
    })
    .where(eq(MediaTable.id, mediaId));
};
