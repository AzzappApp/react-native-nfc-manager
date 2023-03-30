import db from './db';
import type { ProfileCategory } from '@prisma/client';

/**
 * Retrieves a list of all profile categories
 * @returns A list of profile categories
 */
export const getProfileCategories = async (): Promise<ProfileCategory[]> =>
  db
    .selectFrom('ProfileCategory')
    .selectAll()
    .where('available', '=', true)
    .orderBy('order', 'asc')
    .execute();

/**
 * Retrieves a profile category by its id
 * @param id - The id of the profile category to retrieve
 * @returns The profile category if found, otherwise null
 */
export const getProfileCategoryById = async (
  id: string,
): Promise<ProfileCategory | null> => {
  const result = await db
    .selectFrom('ProfileCategory')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
  return result ?? null;
};
