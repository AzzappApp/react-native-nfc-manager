import { and, asc, eq, inArray } from 'drizzle-orm';
import db, { cols } from './db';
import { sortEntitiesByIds } from './generic';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const StaticMediaTable = cols.table('StaticMedia', {
  // we keep defaultVarchar here because raw media id in cloudinary needs to keep
  // an extension, which would be too long for the mediaId (char(26)) column size
  id: cols.defaultVarchar('id').primaryKey().notNull(),
  usage: cols
    .enum('usage', ['coverForeground', 'coverBackground', 'moduleBackground'])
    .notNull(),
  resizeMode: cols
    .enum('resizeMode', ['cover', 'contain', 'center', 'repeat', 'stretch'])
    .default('cover'),
  order: cols.int('order').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
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
