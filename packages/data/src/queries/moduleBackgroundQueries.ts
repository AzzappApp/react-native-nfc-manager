import { and, asc, eq } from 'drizzle-orm';
import { db } from '../database';
import { ModuleBackgroundTable } from '../schema';
import { getEntitiesByIds } from './entitiesQueries';
import type { ModuleBackground } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Create a module background.
 *
 * @param newModuleBackground - The module background fields
 * @returns The id of the created module background
 */
export const createModuleBackground = async (
  newModuleBackground: InferInsertModel<typeof ModuleBackgroundTable>,
): Promise<string> =>
  db()
    .insert(ModuleBackgroundTable)
    .values(newModuleBackground)
    .then(() => newModuleBackground.id);

/**
 * Create a list of module backgrounds.
 *
 * @param newModuleBackground - The module background fields
 * @returns The id of the created module background
 */
export const createModuleBackgrounds = async (
  backgrounds: Array<InferInsertModel<typeof ModuleBackgroundTable>>,
): Promise<string[]> =>
  db()
    .insert(ModuleBackgroundTable)
    .values(backgrounds)
    .then(() => backgrounds.map(({ id }) => id));

/**
 * Reorder module backgrounds.
 *
 * @param ids - The ids of the module backgrounds to reorder
 */
export const reorderModuleBackgrounds = async (
  ids: string[],
): Promise<void> => {
  await Promise.all(
    ids.map((mediaId, index) => {
      return db()
        .update(ModuleBackgroundTable)
        .set({ order: index })
        .where(eq(ModuleBackgroundTable.id, mediaId));
    }),
  );
};

/**
 * Set the enabled status of a module background.
 *
 * @param id - The id of the module background to update
 * @param enabled - The new enabled status
 */
export const setModuleBackgroundEnabled = async (
  id: string,
  enabled: boolean,
): Promise<void> => {
  await db()
    .update(ModuleBackgroundTable)
    .set({ enabled })
    .where(eq(ModuleBackgroundTable.id, id));
};

/**
 * Retrieve a list of module backgrounds by their ids.
 *
 * @param ids - The ids of the module backgrounds list to retrieve
 * @returns
 *  An array corresponding to the ids provided with for each index
 *  the corresponding module background if it exists
 */
export const getModuleBackgroundsByIds = async (
  ids: readonly string[],
): Promise<Array<ModuleBackground | null>> =>
  getEntitiesByIds('ModuleBackground', ids);

/**
 * Retrieves all enabled module backgrounds, sorted by their order field.
 *
 * @param enabledOnly - Whether to only retrieve enabled module backgrounds
 * @returns A list of module backgrounds
 */
export const getModuleBackgrounds = (
  enabledOnly = true,
): Promise<ModuleBackground[]> => {
  let query = db().select().from(ModuleBackgroundTable).$dynamic();
  if (enabledOnly) {
    query = query.where(and(eq(ModuleBackgroundTable.enabled, true)));
  }
  return query.orderBy(asc(ModuleBackgroundTable.order));
};
