import { eq, inArray } from 'drizzle-orm';
import { mysqlEnum, datetime, varchar } from 'drizzle-orm/mysql-core';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
  mysqlTable,
} from './db';
import { customTinyInt } from './generic';
import type { InferModel } from 'drizzle-orm';

export const StaticMediaTable = mysqlTable('StaticMedia', {
  id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH }).primaryKey().notNull(),
  usage: mysqlEnum('usage', [
    'coverForeground',
    'coverBackground',
    'moduleBackground',
  ]).notNull(),
  name: varchar('name', { length: DEFAULT_VARCHAR_LENGTH }),
  available: customTinyInt('available').default(true).notNull(),
  createdAt: datetime('createdAt', {
    mode: 'date',
    fsp: DEFAULT_DATETIME_PRECISION,
  })
    .default(DEFAULT_DATETIME_VALUE)
    .notNull(),
  tags: varchar('tags', { length: DEFAULT_VARCHAR_LENGTH }),
});

export type StaticMedia = InferModel<typeof StaticMediaTable>;
export type NewStaticMedia = InferModel<typeof StaticMediaTable, 'insert'>;

/**
 * Retrieve a list of medias by their ids.
 * @param ids - The ids of the medias to retrieve
 * @returns A list of medias, where the order of the medias matches the order of the ids
 */
export const getStaticMediasByIds = (ids: string[]): Promise<StaticMedia[]> => {
  return db
    .select()
    .from(StaticMediaTable)
    .where(inArray(StaticMediaTable.id, ids))
    .execute();
};

/**
 * Retrieves all cover foregrounds in the database.
 * @returns A list of cover foregrounds.
 */
export const getStaticMediasByUsage = (
  usage: StaticMedia['usage'],
): Promise<StaticMedia[]> =>
  db
    .select()
    .from(StaticMediaTable)
    .where(eq(StaticMediaTable.usage, usage))
    .execute();
