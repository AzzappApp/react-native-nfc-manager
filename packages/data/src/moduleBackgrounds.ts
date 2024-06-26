import { and, asc, eq, inArray } from 'drizzle-orm';
import db, { cols } from './db';
import { sortEntitiesByIds } from './generic';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const ModuleBackgroundTable = cols.table('ModuleBackground', {
  id: cols.mediaId('id').notNull().primaryKey(),
  resizeMode: cols
    .enum('resizeMode', ['cover', 'contain', 'center', 'repeat', 'stretch'])
    .default('cover'),
  order: cols.int('order').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type ModuleBackground = InferSelectModel<typeof ModuleBackgroundTable>;
export type NewModuleBackground = InferInsertModel<
  typeof ModuleBackgroundTable
>;

/**
 * Retrieve a list of medias by their ids.
 * @param ids - The ids of the medias to retrieve
 * @returns A list of medias, where the order of the medias matches the order of the ids
 */
export const getModuleBackgroundsByIds = async (ids: readonly string[]) =>
  sortEntitiesByIds(
    ids,
    await db
      .select()
      .from(ModuleBackgroundTable)
      .where(inArray(ModuleBackgroundTable.id, ids as string[])),
  );

/**
 * Retrieves all cover foregrounds in the database.
 * @returns A list of cover foregrounds.
 */
export const getModuleBackgrounds = async () =>
  db
    .select()
    .from(ModuleBackgroundTable)
    .where(and(eq(ModuleBackgroundTable.enabled, true)))
    .orderBy(asc(ModuleBackgroundTable.order));
