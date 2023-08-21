import { eq } from 'drizzle-orm';
import {
  int,
  mysqlTable,
  primaryKey,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { InferModel } from 'drizzle-orm';

export const CompanyActivityTable = mysqlTable('CompanyActivity', {
  id: cols.cuid('id').notNull().primaryKey(),
  labels: cols.labels('labels').notNull(),
});

export const ProfileCategoryCompanyActivityTable = mysqlTable(
  'ProfileCategoryCompanyActivity',
  {
    profileCategoryId: cols.cuid('profileCategoryId').notNull(),
    companyActivityId: cols.cuid('companyActivityId').notNull(),
    order: int('order').notNull(),
  },
  table => {
    return {
      pk: primaryKey(table.profileCategoryId, table.companyActivityId),
    };
  },
);

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
export const getCompanyActivitiesByProfileCategory = async (
  profileCategoryId: string,
) => {
  return db
    .select()
    .from(CompanyActivityTable)
    .innerJoin(
      ProfileCategoryCompanyActivityTable,
      eq(
        CompanyActivityTable.id,
        ProfileCategoryCompanyActivityTable.companyActivityId,
      ),
    )
    .where(
      eq(
        ProfileCategoryCompanyActivityTable.profileCategoryId,
        profileCategoryId,
      ),
    )
    .orderBy(ProfileCategoryCompanyActivityTable.order)
    .then(res => res.map(r => r.CompanyActivity));
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
