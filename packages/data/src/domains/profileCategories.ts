import { createId } from '@paralleldrive/cuid2';
import { eq, asc } from 'drizzle-orm';
import {
  json,
  int,
  mysqlEnum,
  mysqlTable,
  boolean,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const ProfileCategoryTable = mysqlTable('ProfileCategory', {
  id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
  profileKind: mysqlEnum('profileKind', ['personal', 'business']).notNull(),
  cardTemplateTypeId: cols.cuid('cardTemplateTypeId'),
  labels: cols.labels('labels').notNull(),
  medias: json('medias').$type<string[]>().notNull(),
  order: int('order').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
});

export type ProfileCategory = InferSelectModel<typeof ProfileCategoryTable>;
export type NewProfileCategory = InferInsertModel<typeof ProfileCategoryTable>;

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
