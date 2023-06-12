import { eq, asc } from 'drizzle-orm';
import { json, int, mysqlEnum, varchar } from 'drizzle-orm/mysql-core';
import db, { DEFAULT_VARCHAR_LENGTH, mysqlTable } from './db';
import { customLabels, customTinyInt } from './generic';
import type { InferModel } from 'drizzle-orm';

export const ProfileCategoryTable = mysqlTable('ProfileCategory', {
  id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH }).primaryKey().notNull(),
  profileKind: mysqlEnum('profileKind', ['personal', 'business']).notNull(),
  labels: customLabels('labels'),
  medias: json('medias').notNull(),
  available: customTinyInt('available').default(true).notNull(),
  order: int('order').notNull(),
});

export type ProfileCategory = InferModel<typeof ProfileCategoryTable>;
export type NewProfileCategory = InferModel<
  typeof ProfileCategoryTable,
  'insert'
>;

/**
 * Retrieves a list of all profile categories
 * @returns A list of profile categories
 */
export const getProfileCategories = async (): Promise<ProfileCategory[]> =>
  db
    .select()
    .from(ProfileCategoryTable)
    .where(eq(ProfileCategoryTable.available, true))
    .orderBy(asc(ProfileCategoryTable.order))
    .execute();

/**
 * Retrieves a profile category by its id
 * @param id - The id of the profile category to retrieve
 * @returns The profile category if found, otherwise null
 */
export const getProfileCategoryById = async (
  id: string,
): Promise<ProfileCategory | null> =>
  db
    .select()
    .from(ProfileCategoryTable)
    .where(eq(ProfileCategoryTable.id, id))
    .execute()
    .then(res => res.pop() ?? null);
