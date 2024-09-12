import { asc, count, eq, sql } from 'drizzle-orm';
import { db } from '../database';
import { CoverTemplateTable, CoverTemplateTagTable } from '../schema';
import { getEntitiesByIds } from './entitiesQueries';
import type { CoverTemplateTag } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieve a cover template tag by its id.
 *
 * @param id - The id of the cover template tag to retrieve
 * @returns the cover template tag, or null if no cover template tag was found
 */
export const getCoverTemplateTagById = (
  id: string,
): Promise<CoverTemplateTag> =>
  db()
    .select()
    .from(CoverTemplateTagTable)
    .where(eq(CoverTemplateTagTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Retrieve a list of cover template tags by their ids.
 *
 * @param ids - The ids of the cover template tags to retrieve
 * @returns
 *  An array corresponding to the ids provided with for each index
 *  the corresponding cover template tag if it exists
 */
export const getCoverTemplateTagsByIds = async (
  ids: string[],
): Promise<Array<CoverTemplateTag | null>> =>
  getEntitiesByIds('CoverTemplateTag', ids);

/**
 * Retrieve a list of all cover template tags.
 *
 * @param enabledOnly - Whether to retrieve only enabled cover template tags
 * @returns a list of all cover template tags
 */
export const getCoverTemplateTags = async (
  enabledOnly: boolean = false,
): Promise<CoverTemplateTag[]> => {
  let query = db().select().from(CoverTemplateTagTable).$dynamic();
  if (enabledOnly) {
    query = query.where(eq(CoverTemplateTagTable.enabled, true));
  }
  query.orderBy(asc(CoverTemplateTagTable.order));
  return query;
};

/**
 * Retrieve all cover template tags with the number of templates associated with them.
 *
 * @returns a list of all cover template types that are enabled
 */
export const getCoverTemplateTagsWithTemplatesCount = async (): Promise<
  Array<{
    coverTemplateTag: CoverTemplateTag;
    templatesCount: number;
  }>
> =>
  db()
    .select({
      coverTemplateTag: CoverTemplateTagTable,
      templatesCount: count(CoverTemplateTable.id),
    })
    .from(CoverTemplateTagTable)
    .leftJoin(
      CoverTemplateTable,
      sql.raw(`JSON_CONTAINS(tags, '"${CoverTemplateTagTable.id}"')`),
    )
    .groupBy(CoverTemplateTagTable.id);
/**
 * Create a new cover template tag.
 *
 * @param newCoverTemplateTag - The cover template tag fields
 * @returns The newly created cover template tag id
 */
export const createCoverTemplateTag = async (
  newCoverTemplateTag: InferInsertModel<typeof CoverTemplateTagTable>,
): Promise<string> =>
  db()
    .insert(CoverTemplateTagTable)
    .values(newCoverTemplateTag)
    .$returningId()
    .then(rows => rows[0].id);

/**
 * Update a cover template tag.
 * @param id - The id of the cover template tag to update
 * @param data - The cover template tag fields to update
 * @returns The updated cover template tag id
 */
export const updateCoverTemplateTag = async (
  id: string,
  data: Partial<Omit<CoverTemplateTag, 'id'>>,
): Promise<string> =>
  db()
    .update(CoverTemplateTagTable)
    .set(data)
    .where(eq(CoverTemplateTagTable.id, id))
    .then(() => id);
