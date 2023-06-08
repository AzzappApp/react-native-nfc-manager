import db from './db';
import { getEntitiesByIds } from './generic';
import type { Database } from './db';
import type { Media } from '@prisma/client';
import type { QueryCreator } from 'kysely';

/**
 * Retrieve a list of medias by their ids.
 * @param ids - The ids of the medias to retrieve
 * @returns A list of medias, where the order of the medias matches the order of the ids
 */
export const getMediasByIds = (
  ids: readonly string[],
): Promise<Array<Media | null>> => {
  return getEntitiesByIds('Media', ids, 'id');
};

/**
 * Create a media.
 *
 * @param media - the media fields, excluding the id
 * @param qc - The query creator to use (user for transactions)
 * @returns The created media
 */
export const createMedia = async (
  media: Media,
  qc: QueryCreator<Database> = db,
): Promise<Media> => {
  await qc.insertInto('Media').values(media).execute();
  return media;
};

/**
 * Delete a media.
 *
 * @param id - the id of the media to delete
 * @param qc - The query creator to use (user for transactions)
 * @returns The created media
 */
export const removeMedia = async (
  id: string,
  qc: QueryCreator<Database> = db,
): Promise<void> => {
  await qc.deleteFrom('Media').where('id', '=', id).execute();
};

/**
 * Delete multiple medias.
 *
 * @param ids - the list of medias ids to delete
 * @param qc - The query creator to use (user for transactions)
 * @returns The created media
 */
export const removeMedias = async (
  ids: string[],
  qc: QueryCreator<Database> = db,
): Promise<void> => {
  await qc.deleteFrom('Media').where('id', 'in', ids).execute();
};
