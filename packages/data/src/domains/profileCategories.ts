import { eq, asc } from 'drizzle-orm';
import {
  json,
  int,
  mysqlEnum,
  mysqlTable,
  boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { InferModel } from 'drizzle-orm';

export const ProfileCategoryTable = mysqlTable('ProfileCategory', {
  id: cols.cuid('id').primaryKey().notNull(),
  profileKind: mysqlEnum('profileKind', ['personal', 'business']).notNull(),
  labels: cols.labels('labels').notNull(),
  medias: json('medias').$type<string[]>().notNull(),
  order: int('order').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
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
export const getProfileCategories = async () =>
  db
    .select()
    .from(ProfileCategoryTable)
    .where(eq(ProfileCategoryTable.enabled, true))
    .orderBy(asc(ProfileCategoryTable.order));

/**
 * Retrieves a profile category by its id
 * @param id - The id of the profile category to retrieve
 * @returns The profile category if found, otherwise null
 */
export const getProfileCategoryById = async (id: string) =>
  db
    .select()
    .from(ProfileCategoryTable)
    .where(eq(ProfileCategoryTable.id, id))
    .then(res => res.pop() ?? null);
