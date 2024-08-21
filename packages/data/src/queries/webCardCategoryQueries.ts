import { eq, asc } from 'drizzle-orm';
import { db } from '../database';
import { WebCardCategoryTable } from '../schema';
import type { WebCardCategory } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

export type NewWebCardCategory = InferInsertModel<typeof WebCardCategoryTable>;
/**
 * Creates a new web card category
 *
 * @param newWebCardCategory - The new web card category to create
 * @returns The id of the newly created web card category
 */
export const createWebCardCategory = async (
  newWebCardCategory: NewWebCardCategory,
): Promise<string> =>
  db()
    .insert(WebCardCategoryTable)
    .values(newWebCardCategory)
    .$returningId()
    .then(res => res[0]?.id);

/**
 * Updates a web card category
 *
 * @param id - The id of the web card category to update
 * @param updates - The updates to apply to the web card category
 */
export const updateWebCardCategory = async (
  id: string,
  updates: Partial<Omit<WebCardCategory, 'id'>>,
): Promise<void> => {
  await db()
    .update(WebCardCategoryTable)
    .set(updates)
    .where(eq(WebCardCategoryTable.id, id));
};

/**
 * Retrieves a list of all enabled web card categories
 *
 * @param enabledOnly - Whether to only retrieve enabled web card categories (default: `true`)
 * @returns A list of web card categories
 */
export const getWebCardCategories = async (
  enabledOnly = true,
): Promise<WebCardCategory[]> => {
  let query = db().select().from(WebCardCategoryTable).$dynamic();
  if (enabledOnly) {
    query = query.where(eq(WebCardCategoryTable.enabled, true));
  }
  return query.orderBy(asc(WebCardCategoryTable.order));
};
/**
 * Retrieves a web card category by its id
 *
 * @param id - The id of the web card category to retrieve
 * @returns The web card category if found, otherwise null
 */
export const getWebCardCategoryById = async (
  id: string,
): Promise<WebCardCategory | null> =>
  db()
    .select()
    .from(WebCardCategoryTable)
    .where(eq(WebCardCategoryTable.id, id))
    .then(res => res[0] ?? null);
