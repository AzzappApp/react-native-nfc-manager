import { and, asc, eq, inArray } from 'drizzle-orm';
import { mysqlEnum, mysqlTable, int, boolean } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import { sortEntitiesByIds } from './generic';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const StaticMediaTable = mysqlTable('StaticMedia', {
  id: cols.defaultVarchar('id').primaryKey().notNull(),
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

export type StaticMedia = InferSelectModel<typeof StaticMediaTable>;
export type NewStaticMedia = InferInsertModel<typeof StaticMediaTable>;

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
    .where(
      and(
        eq(StaticMediaTable.usage, usage),
        eq(StaticMediaTable.enabled, true),
      ),
    )
    .orderBy(asc(StaticMediaTable.order));
