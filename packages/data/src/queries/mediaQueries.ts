import { eq, inArray, sql } from 'drizzle-orm';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { getMediaInfoByPublicIds } from '@azzapp/shared/cloudinaryHelpers';
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

// TODO : move this to a service
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
        publicId: media!.id,
        kind: media!.kind,
      })),
    );

    await Promise.all(
      // TODO batch update
      cloudinaryMedias.map(cloudinaryMedia =>
        db()
          .update(MediaTable)
          .set({
            width: cloudinaryMedia!.width,
            height: cloudinaryMedia!.height,
          })
          .where(eq(MediaTable.id, cloudinaryMedia!.public_id)),
      ),
    );
  }
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
  const removedMediaIds = convertToNonNullArray(previousMediaIds ?? []).filter(
    mediaId => !mediaIds.includes(mediaId),
  );

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
