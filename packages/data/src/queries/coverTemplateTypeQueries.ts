import { and, count, eq, sql } from 'drizzle-orm';
import { db } from '../database';
import { CoverTemplateTable, CoverTemplateTypeTable } from '../schema';
import type { CoverTemplateType } from '../schema';
import type { InferInsertModel, SQLWrapper } from 'drizzle-orm';

export type NewCoverTemplateType = InferInsertModel<
  typeof CoverTemplateTypeTable
>;

/**
 * Create a new cover template type.
 *
 * @param newCoverTemplateType - The data of the cover template type to create
 */
export const createCoverTemplateType = async (
  newCoverTemplateType: NewCoverTemplateType,
): Promise<string> =>
  db()
    .insert(CoverTemplateTypeTable)
    .values(newCoverTemplateType)
    .$returningId()
    .then(rows => rows[0]?.id);

/**
 * Update a cover template type.
 *
 * @param id - The id of the cover template type to update
 * @param updates - The updates to apply to the cover template type
 */
export const updateCoverTemplateType = async (
  id: string,
  updates: Partial<Omit<CoverTemplateType, 'id'>>,
): Promise<void> => {
  await db()
    .update(CoverTemplateTypeTable)
    .set(updates)
    .where(eq(CoverTemplateTypeTable.id, id));
};

/**
 * Retrieve a cover template type by its id.
 *
 * @param id - The id of the cover template type to retrieve
 * @returns the cover template type, or null if no cover template type was found
 */
export const getCoverTemplateTypeById = (
  id: string,
): Promise<CoverTemplateType | null> =>
  db()
    .select()
    .from(CoverTemplateTypeTable)
    .where(eq(CoverTemplateTypeTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Retrieve all cover template types
 *
 * @param enabledOnly - If true filter the list to include only enabled cover template types
 * @returns a list of all cover template types
 */
export const getCoverTemplateTypes = async (
  enabledOnly = false,
): Promise<CoverTemplateType[]> => {
  let query = db().select().from(CoverTemplateTypeTable).$dynamic();
  if (enabledOnly) {
    query = query.where(eq(CoverTemplateTypeTable.enabled, true));
  }
  return query;
};

// TODO: I don't understand this query at all
/**
 * Retrieve a list of enabled cover template types paginated.
 *
 * @param limit - The number of cover template types to retrieve
 * @param offset - The number of cover template types to skip
 * @param tagId - The id of the type to filter the list of cover template types by
 *
 * @returns a list of cover template types
 */
export const getFilterCoverTemplateTypes = async (
  limit: number,
  offset: number,
  tagId: string | null | undefined,
): Promise<CoverTemplateType[]> => {
  let query = db()
    .selectDistinct({
      id: CoverTemplateTypeTable.id,
      order: CoverTemplateTypeTable.order,
      enabled: CoverTemplateTypeTable.enabled,
    })
    .from(CoverTemplateTypeTable)
    .where(eq(CoverTemplateTypeTable.enabled, true))
    .$dynamic();

  const filters: SQLWrapper[] = [];
  const contains = `JSON_CONTAINS(tags, '"${tagId}"')`;
  filters.push(sql.raw(contains));
  query = query.innerJoin(
    CoverTemplateTable,
    and(
      eq(CoverTemplateTypeTable.id, CoverTemplateTable.typeId),
      eq(CoverTemplateTable.enabled, true),
      tagId ? sql`${sql.join(filters, sql.raw(' AND '))}` : undefined,
    ),
  );

  query = query
    .limit(limit)
    .offset(offset)
    .orderBy(CoverTemplateTypeTable.order);

  return query;
};

/**
 * Retrieve all cover template types with the number of templates associated with them.
 *
 * @returns a list of all cover template types that are enabled
 */
export const getCoverTemplateTypesWithTemplatesCount = async (): Promise<
  Array<{
    coverTemplateType: CoverTemplateType;
    templatesCount: number;
  }>
> =>
  db()
    .select({
      coverTemplateType: CoverTemplateTypeTable,
      templatesCount: count(CoverTemplateTable.id),
    })
    .from(CoverTemplateTypeTable)
    .leftJoin(
      CoverTemplateTable,
      eq(CoverTemplateTable.typeId, CoverTemplateTypeTable.id),
    )
    .groupBy(CoverTemplateTypeTable.id);
