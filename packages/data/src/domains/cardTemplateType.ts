import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { boolean, mysqlTable } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const CardTemplateTypeTable = mysqlTable('CardTemplateType', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  labels: cols.labels('labels').notNull(),
  webCardCategoryId: cols.cuid('webCardCategoryId').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
});

export type CardTemplateType = InferSelectModel<typeof CardTemplateTypeTable>;
export type NewCardTemplateType = InferInsertModel<
  typeof CardTemplateTypeTable
>;

/**
 * Retrieve a cardTemplateType by its id.
 * @param id - The id of the cardTemplateType to retrieve
 * @returns the cardTemplateType, or null if no cardTemplateType was found
 */
export const getCardTemplateTypeById = (id: string) =>
  db
    .select()
    .from(CardTemplateTypeTable)
    .where(eq(CardTemplateTypeTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Retrive all CardTempaltetype
 *
 */
export const getCardTemplateTypes = async () =>
  db
    .select()
    .from(CardTemplateTypeTable)
    .where(eq(CardTemplateTypeTable.enabled, true));
