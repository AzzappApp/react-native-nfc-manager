import { eq } from 'drizzle-orm';
import { int, varchar } from 'drizzle-orm/mysql-core';
import db, { DEFAULT_VARCHAR_LENGTH, mysqlTable } from './db';
import { customLabels } from './generic';
import type { InferModel } from 'drizzle-orm';

export const CompanyActivityTable = mysqlTable('CompanyActivity', {
  id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH }).primaryKey().notNull(),
  labels: customLabels('labels'),
  profileCategoryId: varchar('profileCategoryId', {
    length: DEFAULT_VARCHAR_LENGTH,
  }).notNull(),
  order: int('order').notNull(),
});

export type CompanyActivity = InferModel<typeof CompanyActivityTable>;
export type NewCompanyActivity = InferModel<
  typeof CompanyActivityTable,
  'insert'
>;

/**
 * Retrieves a list of all company activities
 * @param profileCategoryId - The id of the profile category to filter the list by
 * @returns A list of company activities
 */
export const getCompanyActivities = async (profileCategoryId?: string) => {
  return db
    .select()
    .from(CompanyActivityTable)
    .where(
      profileCategoryId
        ? eq(CompanyActivityTable.profileCategoryId, profileCategoryId)
        : undefined,
    );
};

/**
 * Retrieves a company activity by its id
 * @param id - The id of the company activity to retrieve
 * @returns
 */
export const getCompanyActivityById = async (id: string) => {
  return db
    .select()
    .from(CompanyActivityTable)
    .where(eq(CompanyActivityTable.id, id))

    .then(res => res.pop() ?? null);
};
