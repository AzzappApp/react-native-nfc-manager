import { eq } from 'drizzle-orm';
import db, { cols } from './db';
import { createId } from './helpers/createId';

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const CardTemplateTypeTable = cols.table('CardTemplateType', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  labelKey: cols.defaultVarchar('labelKey').notNull().default(''),
  webCardCategoryId: cols.cuid('webCardCategoryId').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
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
