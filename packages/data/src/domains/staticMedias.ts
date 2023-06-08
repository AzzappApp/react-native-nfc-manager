import db from './db';
import { getEntitiesByIds } from './generic';
import type { StaticMedia, StaticMediaUsage } from '@prisma/client';

/**
 * Retrieve a list of medias by their ids.
 * @param ids - The ids of the medias to retrieve
 * @returns A list of medias, where the order of the medias matches the order of the ids
 */
export const getStaticMediasByIds = (
  ids: readonly string[],
): Promise<Array<StaticMedia | null>> => {
  return getEntitiesByIds('StaticMedia', ids, 'id');
};

/**
 * Retrieves all cover foregrounds in the database.
 * @returns A list of cover foregrounds.
 */
export const getStaticMediasByUsage = (
  usage: StaticMediaUsage,
): Promise<StaticMedia[]> =>
  db.selectFrom('StaticMedia').where('usage', '=', usage).selectAll().execute();
