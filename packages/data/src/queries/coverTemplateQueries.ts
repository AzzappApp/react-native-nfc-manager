import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  like,
  or,
  sql,
} from 'drizzle-orm';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { db } from '../database';
import {
  CoverTemplatePreviewTable,
  CoverTemplateTable,
  LocalizationMessageTable,
} from '../schema';
import type { CoverTemplate } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieve a cover template by its id.
 *
 * @param id - The id of the cover template to retrieve
 * @returns the cover template, or null if no cover template was found
 */
export const getCoverTemplateById = (id: string) =>
  db()
    .select()
    .from(CoverTemplateTable)
    .where(eq(CoverTemplateTable.id, id))
    .then(rows => rows[0] ?? null);

// TODO: using a different `previewId` depending on the user's CompanyActivity
// feels like a bad idea, we should probably find a better way to handle this
/**
 * Retrieve cover templates by type ids and tag id.
 *
 * @param typeIds - The ids of the cover template types to filter by
 * @param tagId - The id of the cover template tag to filter by
 * @param companyActivityId
 *  - The id of the company activity for which to retrieve the cover templates preview
 *
 * @returns a list of cover templates that match the given type ids and tag id
 */
export const getCoverTemplatesByTypesAndTag = async (
  typeIds: string[],
  tagId?: string | null,
  companyActivityId?: string | null,
) => {
  const tagIdJson = tagId ? JSON.stringify([tagId]) : null;

  if (typeIds.length === 0) return [];

  return db()
    .select({
      previewId: sql`COALESCE(${CoverTemplatePreviewTable.mediaId}, ${CoverTemplateTable.previewId})`,
      CoverTemplateTable,
    })
    .from(CoverTemplateTable)
    .leftJoin(
      CoverTemplatePreviewTable,
      and(
        eq(CoverTemplateTable.id, CoverTemplatePreviewTable.coverTemplateId),
        companyActivityId
          ? eq(CoverTemplatePreviewTable.companyActivityId, companyActivityId)
          : isNull(CoverTemplatePreviewTable.companyActivityId),
      ),
    )
    .where(
      and(
        inArray(CoverTemplateTable.typeId, typeIds),
        eq(CoverTemplateTable.enabled, true),
        tagIdJson ? sql`JSON_CONTAINS(tags, ${tagIdJson})` : undefined,
      ),
    )
    .then(rows =>
      rows.map(row => ({
        ...row.CoverTemplateTable,
        previewId: row.previewId as string,
      })),
    );
};

/**
 * Retrieve a list of cover templates with their type label, with optional filters and pagination.
 *
 * @param args - The filters and pagination options
 * @param args.offset - The offset to start from
 * @param args.limit - The maximum number of cover templates to retrieve
 * @param args.sortField - The field to sort the cover templates by
 * @param args.sortOrder - The order to sort the cover templates by
 * @param args.search - A search string to filter the cover templates by
 * @param args.enabled - Whether to filter the cover templates by their enabled status
 * @param args.locale - The locale to retrieve the cover template type label in
 * @returns The list of cover templates with their type label, and the total number of cover templates
 */
export const getCoverTemplatesWithTypeLabel = async ({
  locale = DEFAULT_LOCALE,
  offset = 0,
  limit = 10,
  sortField = 'name',
  sortOrder = 'asc',
  search,
  enabled = undefined,
}: {
  offset: number;
  limit: number;
  sortField: 'name' | 'type';
  sortOrder: 'asc' | 'desc';
  search?: string | null;
  enabled?: boolean | undefined;
  locale?: string;
}): Promise<{
  items: Array<{
    coverTemplate: CoverTemplate;
    typeLabel: string;
  }>;
  count: number;
}> => {
  let query = db()
    .select({
      coverTemplate: CoverTemplateTable,
      typeLabel: LocalizationMessageTable.value,
    })
    .from(CoverTemplateTable)
    .innerJoin(
      LocalizationMessageTable,
      and(
        eq(CoverTemplateTable.typeId, LocalizationMessageTable.key),
        eq(LocalizationMessageTable.locale, locale),
      ),
    )
    .$dynamic();

  let countQuery = db()
    .select({
      count: count(),
    })
    .from(CoverTemplateTable)
    .innerJoin(
      LocalizationMessageTable,
      and(
        eq(CoverTemplateTable.typeId, LocalizationMessageTable.key),
        eq(LocalizationMessageTable.locale, locale),
      ),
    )
    .$dynamic();

  if (search) {
    const filter = or(
      like(LocalizationMessageTable.value, `%${search}%`),
      like(CoverTemplateTable.name, `%${search}%`),
    );
    query = query.where(filter);
    countQuery = countQuery.where(filter);
  }
  if (enabled !== undefined) {
    const filter = eq(CoverTemplateTable.enabled, enabled);
    query = query.where(filter);
    countQuery = countQuery.where(filter);
  }

  const sortFunc = sortOrder === 'asc' ? asc : desc;
  query = query.orderBy(
    sortFunc(
      sortField === 'type'
        ? LocalizationMessageTable.value
        : CoverTemplateTable.name,
    ),
  );

  const [items, nbItems] = await Promise.all([
    query.offset(offset).limit(limit),
    countQuery.then(rows => rows[0].count),
  ]);

  return { items, count: nbItems };
};

/**
 * Create a new cover template.
 * @param newCoverTemplate - The cover template fields
 *
 * @returns The newly created cover template id
 */
export const createCoverTemplate = (
  newCoverTemplate: InferInsertModel<typeof CoverTemplateTable>,
) =>
  db()
    .insert(CoverTemplateTable)
    .values(newCoverTemplate)
    .$returningId()
    .then(res => res[0].id);

/**
 * Update a cover template.
 *
 * @param coverTemplateId - The id of the cover template to update
 * @param updates - The updates to apply to the cover template
 */
export const updateCoverTemplate = async (
  coverTemplateId: string,
  updates: Partial<Omit<CoverTemplate, 'id'>>,
): Promise<void> => {
  await db()
    .update(CoverTemplateTable)
    .set(updates)
    .where(eq(CoverTemplateTable.id, coverTemplateId));
};
