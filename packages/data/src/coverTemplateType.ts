import { eq } from 'drizzle-orm';
import db, { cols } from './db';
import { createId } from './helpers/createId';

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const CoverTemplateTypeTable = cols.table('CoverTemplateType', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  labelKey: cols.defaultVarchar('labelKey').notNull().default(''),
  order: cols.int('order').notNull().default(0),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type CoverTemplateType = InferSelectModel<typeof CoverTemplateTypeTable>;
export type NewCoverTemplateType = InferInsertModel<
  typeof CoverTemplateTypeTable
>;

/**
 * Retrieve a coverTemplateType by its id.
 * @param id - The id of the coverTemplateType to retrieve
 * @returns the coverTemplateType, or null if no coverTemplateType was found
 */
export const getCoverTemplateTypeById = (id: string) =>
  db
    .select()
    .from(CoverTemplateTypeTable)
    .where(eq(CoverTemplateTypeTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Retrieve CoverTemplateType
 *
 */
export const getCoverTemplateTypes = async () => {
  return db.select().from(CoverTemplateTypeTable);
};
