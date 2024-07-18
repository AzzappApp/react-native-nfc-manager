import { and, eq, sql } from 'drizzle-orm';
import { CoverTemplateTable } from '#coverTemplates';
import db, { cols } from './db';
import { createId } from './helpers/createId';

import type {
  InferInsertModel,
  InferSelectModel,
  SQLWrapper,
} from 'drizzle-orm';

export const CoverTemplateTypeTable = cols.table('CoverTemplateType', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
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
export const getCoverTemplateTypes = async (onlyEnabled = false) => {
  const query = db.select().from(CoverTemplateTypeTable);

  if (onlyEnabled) {
    query.where(eq(CoverTemplateTypeTable.enabled, true));
  }

  return query;
};

/**
 * Retrieve CoverTemplateType
 *
 */
export const getFilterCoverTemplateTypes = async (
  limit: number,
  offset: number,
  tagId: string | null | undefined,
) => {
  const query = db
    .selectDistinct({
      id: CoverTemplateTypeTable.id,
      order: CoverTemplateTypeTable.order,
      enabled: CoverTemplateTypeTable.enabled,
    })
    .from(CoverTemplateTypeTable)
    .where(eq(CoverTemplateTypeTable.enabled, true));

  const filters: SQLWrapper[] = [];
  const contains = `JSON_CONTAINS(tags, '"${tagId}"')`;
  filters.push(sql.raw(contains));
  query.innerJoin(
    CoverTemplateTable,
    and(
      eq(CoverTemplateTypeTable.id, CoverTemplateTable.typeId),
      eq(CoverTemplateTable.enabled, true),
      tagId ? sql`${sql.join(filters, sql.raw(' AND '))}` : undefined,
    ),
  );
  query.limit(limit).offset(offset).orderBy(CoverTemplateTypeTable.order);

  return query;
};
