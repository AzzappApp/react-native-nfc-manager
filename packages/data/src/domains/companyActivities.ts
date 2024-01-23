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

export const WebCardCategoryCompanyActivityTable = mysqlTable(
  'WebCardCategoryCompanyActivity',
  {
    webCardCategoryId: cols.cuid('categoryId').notNull(),
    companyActivityId: cols.cuid('companyActivityId').notNull(),
    order: int('order').notNull(),
  },
  table => {
    return {
      pk: primaryKey(table.webCardCategoryId, table.companyActivityId),
    };
  },
);

export type CompanyActivity = InferSelectModel<typeof CompanyActivityTable>;
export type NewCompanyActivity = InferInsertModel<typeof CompanyActivityTable>;

/**
 * Retrieves a list of all company activities
 * @param webCardCategoryId - The id of the webCard category to filter the list by
 * @returns A list of company activities
 */
export const getCompanyActivitiesByWebCardCategory = async (
  webCardCategoryId: string,
) => {
  return db
    .select()
    .from(CompanyActivityTable)
    .innerJoin(
      WebCardCategoryCompanyActivityTable,
      eq(
        CompanyActivityTable.id,
        WebCardCategoryCompanyActivityTable.companyActivityId,
      ),
    )
    .where(
      eq(
        WebCardCategoryCompanyActivityTable.webCardCategoryId,
        webCardCategoryId,
      ),
    )
    .orderBy(WebCardCategoryCompanyActivityTable.order)
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
