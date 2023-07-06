import { eq, inArray } from 'drizzle-orm';
import {
  mysqlEnum,
  double,
  varchar,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { DEFAULT_VARCHAR_LENGTH } from './db';
import { sortEntitiesByIds } from './generic';
import type { DbTransaction } from './db';
import type { InferModel } from 'drizzle-orm';

export const MediaTable = mysqlTable('Media', {
  id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH }).primaryKey().notNull(),
  kind: mysqlEnum('kind', ['image', 'video']).notNull(),
  height: double('height').notNull(),
  width: double('width').notNull(),
});

export type Media = InferModel<typeof MediaTable>;
export type NewMedia = InferModel<typeof MediaTable, 'insert'>;

/**
 * Retrieve a list of media by their ids.
 * @param ids - The ids of the media to retrieve
 * @returns A list of media, where the order of the media matches the order of the ids
 */
export const getMediasByIds = async (
  ids: readonly string[],
  tx: DbTransaction = db,
) =>
  sortEntitiesByIds(
    ids,
    await tx
      .select()
      .from(MediaTable)
      .where(inArray(MediaTable.id, ids as string[])),
  );

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
  await tx.insert(MediaTable).values(newMedia);
  return newMedia;
};

export const createMedias = async (
  newMedias: NewMedia[],
  tx: DbTransaction = db,
) => {
  await tx.insert(MediaTable).values(newMedias);
  return newMedias;
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
