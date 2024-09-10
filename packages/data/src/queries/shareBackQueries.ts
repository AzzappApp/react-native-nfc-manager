import { db } from '../database';
import { ShareBackTable } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

export type NewShareBack = InferInsertModel<typeof ShareBackTable>;
/**
 * Save a shareBack
 *
 * @param newShareBack - The shareBack data to save
 */
export const saveShareBack = async (newShareBack: NewShareBack) => {
  await db().insert(ShareBackTable).values(newShareBack);
};
