import { and, eq } from 'drizzle-orm';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const CoverTemplatePreviewTable = cols.table(
  'CoverTemplatePreview',
  {
    media: cols.mediaId('media').notNull(),
    coverTemplateId: cols.cuid('coverTemplateId').notNull(),
    companyActivityId: cols.cuid('companyActivityId').notNull(),
  },
  table => {
    return {
      coverTemplatePreviewCoverTemplateIdCompanyActivityId: cols.primaryKey({
        columns: [table.coverTemplateId, table.companyActivityId],
      }),
    };
  },
);

export type CoverTemplatePreview = InferSelectModel<
  typeof CoverTemplatePreviewTable
>;
export type NewCoverTemplatePreview = InferInsertModel<
  typeof CoverTemplatePreviewTable
>;

export const getCoverTemplatePreview = async (
  coverTemplateId: string,
  companyActivityId: string,
) => {
  const [data] = await db
    .select()
    .from(CoverTemplatePreviewTable)
    .where(
      and(
        eq(CoverTemplatePreviewTable.coverTemplateId, coverTemplateId),
        eq(CoverTemplatePreviewTable.companyActivityId, companyActivityId),
      ),
    );

  return data;
};

export const getCoverTemplatePreviewsByCoverTemplateId = (
  coverTemplateId: string,
) =>
  db
    .select()
    .from(CoverTemplatePreviewTable)
    .where(eq(CoverTemplatePreviewTable.coverTemplateId, coverTemplateId));

/**
 * Create a new cover template preview
 * @param data - The user fields, excluding the id
 * @returns The newly created user
 */
export const createCoverTemplatePreview = async (
  data: NewCoverTemplatePreview,
) => db.client().insert(CoverTemplatePreviewTable).values(data);

export const updateCoverTemplatePreview = async (
  coverTemplateId: string,
  companyActivityId: string,
  data: Partial<CoverTemplatePreview>,
): Promise<void> => {
  await db
    .update(CoverTemplatePreviewTable)
    .set(data)
    .where(
      and(
        eq(CoverTemplatePreviewTable.coverTemplateId, coverTemplateId),
        eq(CoverTemplatePreviewTable.companyActivityId, companyActivityId),
      ),
    );
};

export const removeCoverTemplatePreviewById = async (
  coverTemplateId: string,
  companyActivityId: string,
  trx: DbTransaction = db,
) => {
  await trx
    .delete(CoverTemplatePreviewTable)
    .where(
      and(
        eq(CoverTemplatePreviewTable.coverTemplateId, coverTemplateId),
        eq(CoverTemplatePreviewTable.companyActivityId, companyActivityId),
      ),
    );
};
