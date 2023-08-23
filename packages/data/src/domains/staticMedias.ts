import { asc, eq, inArray } from 'drizzle-orm';
import {
  mysqlEnum,
  varchar,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
  int,
  boolean,
} from 'drizzle-orm/mysql-core';
import db, { DEFAULT_VARCHAR_LENGTH } from './db';
import { sortEntitiesByIds } from './generic';
import type { InferModel } from 'drizzle-orm';

export const StaticMediaTable = mysqlTable('StaticMedia', {
  id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH }).primaryKey().notNull(),
  usage: mysqlEnum('usage', [
    'coverForeground',
    'coverBackground',
    'moduleBackground',
  ]).notNull(),
  resizeMode: mysqlEnum('resizeMode', [
    'cover',
    'contain',
    'center',
    'repeat',
    'stretch',
  ]).default('cover'),
  order: int('order').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
});

export type StaticMedia = InferModel<typeof StaticMediaTable>;
export type NewStaticMedia = InferModel<typeof StaticMediaTable, 'insert'>;

/**
 * Retrieve a list of medias by their ids.
 * @param ids - The ids of the medias to retrieve
 * @returns A list of medias, where the order of the medias matches the order of the ids
 */
export const getStaticMediasByIds = async (ids: readonly string[]) =>
  sortEntitiesByIds(
    ids,
    await db
      .select()
      .from(StaticMediaTable)
      .where(inArray(StaticMediaTable.id, ids as string[])),
  );

/**
 * Retrieves all cover foregrounds in the database.
 * @returns A list of cover foregrounds.
 */
export const getStaticMediasByUsage = async (usage: StaticMedia['usage']) =>
  db
    .select()
    .from(StaticMediaTable)
    .where(eq(StaticMediaTable.usage, usage))
    .orderBy(asc(StaticMediaTable.order));
