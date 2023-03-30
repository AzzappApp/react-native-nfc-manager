import db from './db';
import type { Interest } from '@prisma/client';

/**
 * Retrieves a list of all interests
 * @returns A list of interests
 */
export const getInterests = async (): Promise<Interest[]> =>
  db.selectFrom('Interest').selectAll().execute();

/**
 * Retrieves a interest by its id
 * @param id - The id of the interest to retrieve
 * @returns
 */
export const getInterestById = async (
  tag: string,
): Promise<Interest | null> => {
  const result = await db
    .selectFrom('Interest')
    .selectAll()
    .where('tag', '=', tag)
    .executeTakeFirst();
  return result ?? null;
};
