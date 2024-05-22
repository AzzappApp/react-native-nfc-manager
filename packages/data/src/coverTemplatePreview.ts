import { eq } from 'drizzle-orm';
import db, { cols } from './db';
import { createId } from './helpers/createId';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const CoverTemplatePreviewTable = cols.table('CoverTemplatePreview', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  media: cols.mediaId('media').notNull(),
  coverTemplateId: cols.cuid('coverTemplateId').notNull(),
  companyActivityId: cols.cuid('companyActivityId').notNull(),
});

export type CoverTemplatePreview = InferSelectModel<
  typeof CoverTemplatePreviewTable
>;
export type NewCoverTemplatePreview = InferInsertModel<
  typeof CoverTemplatePreviewTable
>;

export const getCoverTemplatePreviewById = (id: string) =>
  db
    .select()
    .from(CoverTemplatePreviewTable)
    .where(eq(CoverTemplatePreviewTable.id, id))
    .then(rows => rows[0] ?? null);

export const getCoverTemplatePreviewsByCoverTemplateId = (
  coverTemplateId: string,
) =>
  db
    .select()
    .from(CoverTemplatePreviewTable)
    .where(eq(CoverTemplatePreviewTable.coverTemplateId, coverTemplateId));
