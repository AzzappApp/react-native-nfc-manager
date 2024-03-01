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

export const WebCardCategoryTable = mysqlTable('WebCardCategory', {
  id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
  webCardKind: mysqlEnum('webCardKind', ['personal', 'business']).notNull(),
  cardTemplateTypeId: cols.cuid('cardTemplateTypeId'),
  labels: cols.labels('labels').notNull(),
  medias: json('medias').$type<string[]>().notNull(),
  order: int('order').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
});

export type WebCardCategory = InferSelectModel<typeof WebCardCategoryTable>;
export type NewWebCardCategory = InferInsertModel<typeof WebCardCategoryTable>;

/**
 * Retrieves a list of all WebCard categories
 * @returns A list of WebCard categories
 */
export const getWebCardCategories = async () =>
  db
    .select()
    .from(WebCardCategoryTable)
    .where(eq(WebCardCategoryTable.enabled, true))
    .orderBy(asc(WebCardCategoryTable.order));

/**
 * Retrieves a WebCard category by its id
 * @param id - The id of the WebCard category to retrieve
 * @returns The WebCard category if found, otherwise null
 */
export const getWebCardCategoryById = async (id: string) =>
  db
    .select()
    .from(WebCardCategoryTable)
    .where(eq(WebCardCategoryTable.id, id))
    .then(res => res.pop() ?? null);
