import { eq } from 'drizzle-orm';
import { db } from '../database';
import { CoverTemplatePreviewTable } from '../schema';
import type { CoverTemplatePreview } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieve a cover template preview by its coverTemplateId.
 *
 * @param coverTemplateId - The id of the coverTemplate associated with the preview
 * @returns the cover template preview, or null if no cover template preview was found
 */
export const getCoverTemplatePreview = async (coverTemplateId: string) => {
  const [data] = await db()
    .select()
    .from(CoverTemplatePreviewTable)
    .where(eq(CoverTemplatePreviewTable.coverTemplateId, coverTemplateId));

  return data;
};

/**
 * Retrieve a list of cover template previews associated with a cover template.
 *
 * @param coverTemplateId - The id of the cover template to retrieve the previews for
 * @returns A list of cover template previews
 */
export const getCoverTemplatePreviewsByCoverTemplateId = (
  coverTemplateId: string,
): Promise<CoverTemplatePreview[]> =>
  db()
    .select()
    .from(CoverTemplatePreviewTable)
    .where(eq(CoverTemplatePreviewTable.coverTemplateId, coverTemplateId));

/**
 * Create a new cover template preview.
 * @param newCoverTemplatePreview - the cover template preview fields
 */
export const createCoverTemplatePreview = async (
  newCoverTemplatePreview: InferInsertModel<typeof CoverTemplatePreviewTable>,
) => {
  await db().insert(CoverTemplatePreviewTable).values(newCoverTemplatePreview);
};

/**
 * Update a cover template preview.
 * @param coverTemplateId the id of the CoverTemplate
 * @param updates the updates to apply to the cover template preview
 */
export const updateCoverTemplatePreview = async (
  coverTemplateId: string,
  updates: { mediaId: string },
): Promise<void> => {
  await db()
    .update(CoverTemplatePreviewTable)
    .set(updates)
    .where(eq(CoverTemplatePreviewTable.coverTemplateId, coverTemplateId));
};

/**
 * Delete a cover template preview
 *
 * @param coverTemplateId the id of the cover template associated with the preview
 */
export const removeCoverTemplatePreviewById = async (
  coverTemplateId: string,
) => {
  await db()
    .delete(CoverTemplatePreviewTable)
    .where(eq(CoverTemplatePreviewTable.coverTemplateId, coverTemplateId));
};
