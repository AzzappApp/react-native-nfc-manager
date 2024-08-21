import { eq } from 'drizzle-orm';
import { db } from '../database';
import {
  CompanyActivityTable,
  CompanyActivityTypeTable,
  WebCardCategoryCompanyActivityTable,
} from '../schema';
import type { CompanyActivity, CompanyActivityType } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieves a list of company activities for a given web card category.
 *
 * @param webCardCategoryId - The id of the web card category to retrieve the company activities for
 * @returns A list of company activities
 */
export const getCompanyActivitiesByWebCardCategory = async (
  webCardCategoryId: string,
): Promise<CompanyActivity[]> => {
  return db()
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
 * Retrieves a list of company activities
 *
 *
 * @returns A list of company activities
 */
export const getCompanyActivities = async (): Promise<CompanyActivity[]> =>
  db().select().from(CompanyActivityTable);

/**
 * Retrieves a company activity by its id
 * @param id - The id of the company activity to retrieve
 * @returns The company activity, or null if no company activity was found
 */
export const getCompanyActivityById = async (
  id: string,
): Promise<CompanyActivity | null> => {
  return db()
    .select()
    .from(CompanyActivityTable)
    .where(eq(CompanyActivityTable.id, id))
    .then(res => res[0] ?? null);
};

/**
 * Retrieves a company activity type by its id
 *
 * @param id - The id of the company activity type to retrieve
 * @returns The company activity type, or null if no company activity type was found
 */
export const getCompanyActivityTypeById = async (
  id: string,
): Promise<CompanyActivityType | null> =>
  db()
    .select()
    .from(CompanyActivityTypeTable)
    .where(eq(CompanyActivityTypeTable.id, id))
    .then(res => res[0] ?? null);

/**
 * Retrieves all company activity types
 *
 * @returns A list of all company activity types
 */
export const getCompanyActivityTypes = async (): Promise<
  CompanyActivityType[]
> => db().select().from(CompanyActivityTypeTable);

/**
 * Update a company activity.
 *
 * @param id - The id of the card template to update
 * @param updates - the updates to apply to the company activity
 */
export const updateCompanyActivity = async (
  id: string,
  updates: Partial<Omit<CompanyActivity, 'id'>>,
) => {
  await db()
    .update(CompanyActivityTable)
    .set(updates)
    .where(eq(CompanyActivityTable.id, id));
};

/**
 * Create a company activity.
 *
 * @param newCompanyActivity - the company activity fields
 * @returns The id of the created company activity
 */
export const createCompanyActivity = async (
  newCompanyActivity: InferInsertModel<typeof CompanyActivityTable>,
) =>
  db()
    .insert(CompanyActivityTable)
    .values(newCompanyActivity)
    .$returningId()
    .then(res => res[0].id);

export const createCompanyActivities = async (
  newCompanyActivities: Array<InferInsertModel<typeof CompanyActivityTable>>,
) =>
  db()
    .insert(CompanyActivityTable)
    .values(newCompanyActivities)
    .$returningId()
    .then(res => res.map(r => r.id));

/**
 * Create a company activity type.
 *
 * @param newCompanyActivityType - the company activity type fields
 * @returns
 */
export const createCompanyActivitiesType = (
  newCompanyActivityType: {
    id?: string;
  } = {},
) =>
  db()
    .insert(CompanyActivityTypeTable)
    .values(newCompanyActivityType)
    .$returningId()
    .then(res => res[0].id);

export const createWebCardCategoryCompanyActivities = async (
  webCardCategoryId: string,
  companyActivityIds: string[],
) => {
  await db()
    .insert(WebCardCategoryCompanyActivityTable)
    .values(
      companyActivityIds.map((companyActivityId, index) => ({
        webCardCategoryId,
        companyActivityId,
        order: index,
      })),
    );
};
/**
 * Remove all associations between a web card category and company activities
 *
 * @param webCardCategoryId - The id of the web card category to remove associations for
 */
export const removeAllWebCardCategoryCompanyActivities = async (
  webCardCategoryId: string,
): Promise<void> => {
  await db()
    .delete(WebCardCategoryCompanyActivityTable)
    .where(
      eq(
        WebCardCategoryCompanyActivityTable.webCardCategoryId,
        webCardCategoryId,
      ),
    );
};
