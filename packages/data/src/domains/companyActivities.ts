import db from './db';
import type { CompanyActivity } from '@prisma/client';

/**
 * Retrieves a list of all company activities
 * @param profileCategoryId - The id of the profile category to filter the list by
 * @returns A list of company activities
 */
export const getCompanyActivities = async (
  profileCategoryId?: string,
): Promise<CompanyActivity[]> => {
  let query = db.selectFrom('CompanyActivity').selectAll();
  if (profileCategoryId) {
    query = query.where('profileCategoryId', '=', profileCategoryId);
  }
  return query.execute();
};

/**
 * Retrieves a company activity by its id
 * @param id - The id of the company activity to retrieve
 * @returns
 */
export const getCompanyActivityById = async (
  id: string,
): Promise<CompanyActivity | null> => {
  const result = await db
    .selectFrom('CompanyActivity')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
  return result ?? null;
};
