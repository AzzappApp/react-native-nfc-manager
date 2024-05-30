import { eq, inArray } from 'drizzle-orm';
import db, { cols } from './db';
import { createId } from './helpers/createId';

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const CoverTemplateTagTable = cols.table('CoverTemplateTag', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  labelKey: cols.defaultVarchar('labelKey').notNull().default(''),
  order: cols.int('order').notNull().default(0),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type CoverTemplateTag = InferSelectModel<typeof CoverTemplateTagTable>;
export type NewCoverTemplateTag = InferInsertModel<
  typeof CoverTemplateTagTable
>;

/**
 * Retrieve a coverTemplateTag by its id.
 * @param id - The id of the coverTemplateTag to retrieve
 * @returns the coverTemplateTag, or null if no coverTemplateTag was found
 */
export const getCoverTemplateTagById = (id: string) =>
  db
    .select()
    .from(CoverTemplateTagTable)
    .where(eq(CoverTemplateTagTable.id, id))
    .then(rows => rows[0] ?? null);

export const getCoverTemplateTagsIn = (ids: string[]) => {
  return db
    .select()
    .from(CoverTemplateTagTable)
    .where(inArray(CoverTemplateTagTable.id, ids));
};

/**
 * Retrieve all CoverTemplateTag
 *
 */
export const getCoverTemplateTags = async () =>
  db.select().from(CoverTemplateTagTable);
