import { db, transaction } from '../database';
import { ShareBackTable } from '../schema';
import { incrementShareBacksTotal } from './profileQueries';
import { incrementShareBacks } from './profileStatisticQueries';
import type { InferInsertModel } from 'drizzle-orm';

export type NewShareBack = InferInsertModel<typeof ShareBackTable>;
/**
 * Save a shareBack
 *
 * @param newShareBack - The shareBack data to save
 */
export const saveShareBack = async (newShareBack: NewShareBack) => {
  await transaction(async () => {
    await db().insert(ShareBackTable).values(newShareBack);
    await incrementShareBacksTotal(newShareBack.profileId);
    await incrementShareBacks(newShareBack.profileId, true);
  });
};
