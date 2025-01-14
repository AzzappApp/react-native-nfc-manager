import { eq, sql } from 'drizzle-orm';
import { db } from '../database';
import { CoverPredefinedTable } from '../schema';
import type { CoverPredefined } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

export type NewCoverPredefined = InferInsertModel<typeof CoverPredefinedTable>;
/**
 * Creates a predefined cover
 *
 * @param newCover - The new cover configuration to create
 * @returns The id of the newly created cover
 */
export const createPredefinedCover = async (
  newCover: NewCoverPredefined,
): Promise<string> =>
  db()
    .insert(CoverPredefinedTable)
    .values(newCover)
    .$returningId()
    .then(res => res[0]?.id);

/**
 * Updates a predefined cover
 *
 * @param id - The id of the cover to update
 * @param updates - The updates to apply to the cover
 */
export const updatePredefinedCover = async (
  id: string,
  updates: Partial<Omit<CoverPredefined, 'id'>>,
): Promise<void> => {
  await db()
    .update(CoverPredefinedTable)
    .set(updates)
    .where(eq(CoverPredefinedTable.id, id));
};

/**
 * Retrieves all predefined cover
 * @returns The covers if found, otherwise null
 */
export const getPredefinedCovers = async (): Promise<CoverPredefined[]> => {
  return db().select().from(CoverPredefinedTable);
  // .then(res => res ?? []);
};

/**
 * Retrieves a predefined cover by its id
 *
 * @param id - The id of the cover to retrieve
 * @returns The cover if found, otherwise null
 */
export const getPredefinedCoverById = async (
  id: string,
): Promise<CoverPredefined | null> =>
  db()
    .select()
    .from(CoverPredefinedTable)
    .where(eq(CoverPredefinedTable.id, id))
    .then(res => res[0] ?? null);

/**
 * get a random predefined cover
 *
 * @return a predefined cover
 */
export const pickRandomPredefinedCover = async (): Promise<CoverPredefined> => {
  return db()
    .select()
    .from(CoverPredefinedTable)
    .orderBy(sql`RAND()`)
    .limit(1)
    .then(res => res[0] ?? null);
};

/**
 * Creates a predefined cover
 *
 * @param newCover - The new cover configuration to create
 * @returns The id of the newly created cover
 */
export const deletePredefinedCover = async (coverId: string) =>
  db().delete(CoverPredefinedTable).where(eq(CoverPredefinedTable.id, coverId));
