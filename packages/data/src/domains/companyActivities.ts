import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { int, mysqlTable, primaryKey } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const CompanyActivityTable = mysqlTable('CompanyActivity', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  labels: cols.labels('labels').notNull(),
  cardTemplateTypeId: cols.cuid('cardTemplateTypeId'),
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

export type CompanyActivity = InferSelectModel<typeof CompanyActivityTable>;
export type NewCompanyActivity = InferInsertModel<typeof CompanyActivityTable>;

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

/**
 * Update a company Activity
 *
 * @param id - The id of the card template to update
 * @param values - the company activity fields, excluding the id and the cardDate
 * @param tx - The query creator to use (profile for transactions)
 */
export const updateCompanyActivity = async (
  id: string,
  values: Partial<CompanyActivity>,
  tx: DbTransaction = db,
) => {
  await tx
    .update(CompanyActivityTable)
    .set({ ...values })
    .where(eq(CompanyActivityTable.id, id));
};

/**
 * Create a cardTemplate.
 *
 * @param newCardTemplate - the cardTemplate fields, excluding the id
 * @param tx - The query creator to use (user for transactions)
 * @returns The created cardTemplate
 */
export const createCompanyActivity = async (
  newCardTemplate: NewCompanyActivity,
  tx: DbTransaction = db,
) => {
  const id = createId();
  await tx.insert(CompanyActivityTable).values({ ...newCardTemplate, id });
  return id;
};
