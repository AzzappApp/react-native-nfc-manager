import { and, asc, eq, gt, sql } from 'drizzle-orm';
import { CoverTemplateTypeTable } from '#coverTemplateType';
import db, { cols } from './db';
import { createId } from './helpers/createId';
import type {
  InferInsertModel,
  InferSelectModel,
  SQLWrapper,
} from 'drizzle-orm';

export const CoverTemplateTable = cols.table('CoverTemplate', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  name: cols.defaultVarchar('name').notNull(),
  order: cols.int('order').notNull().default(1),
  tags: cols.json('tags').$type<string[]>().notNull(),
  type: cols.cuid('type').notNull(),
  lottie: cols.json('lottie').notNull(),
});

export type CoverTemplate = InferSelectModel<typeof CoverTemplateTable>;
export type NewCoverTemplate = InferInsertModel<typeof CoverTemplateTable>;

/**
 * Retrieve a coverTemplate by its id.
 * @param id - The id of the coverTemplate to retrieve
 * @returns the coverTemplate, or null if no cardTemplate was found
 */
export const getCoverTemplateById = (id: string) =>
  db
    .select()
    .from(CoverTemplateTable)
    .where(eq(CoverTemplateTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Return a list of cover templates. filtered by profile kind and template kind
 * @param webCardKind the webCard kind to filter by
 * @param templateKind the template kind to filter by
 * @param randomSeed the random seed to use for random ordering
 * @param offset the offset to use for pagination
 * @param limit the limit to use for pagination
 * @return {*}  {Promise<Array<CoverTemplate & { cursor: string }>>}
 */
export const getCoverTemplates = async (
  webCardKind: 'business' | 'personal',
  templateKind: 'others' | 'people' | 'video',
  randomSeed: string,
  offset?: string | null,
  limit?: number | null,
) => {
  const query = sql`
    SELECT *, RAND(${randomSeed}) as cursor
    FROM CoverTemplate`;

  // const query = sql`
  //   SELECT *, RAND(${randomSeed}) as cursor
  //   FROM CoverTemplate
  //   WHERE ${
  //     webCardKind === 'business'
  //       ? CoverTemplateTable.businessEnabled
  //       : CoverTemplateTable.personalEnabled
  //   } = 1
  //   AND ${CoverTemplateTable.kind} = ${templateKind}`;
  if (offset) {
    query.append(sql` HAVING cursor > ${offset} `);
  }
  query.append(sql` ORDER BY cursor `);
  if (limit) {
    query.append(sql` LIMIT ${limit} `);
  }

  return (await db.execute(query)).rows as Array<
    CoverTemplate & { cursor: string }
  >;
};

export const getCoverTemplatesByType = (typeId: string) =>
  db
    .select()
    .from(CoverTemplateTable)
    .where(eq(CoverTemplateTable.type, typeId));

export const getCoverTemplatesByTypeAndTag = async (
  typeId: string,
  tagId: string,
) => {
  const query = sql`
  SELECT *
  FROM CoverTemplate
  WHERE type = ${typeId}
  AND JSON_CONTAINS (tags, ${tagId})`;

  const executed = await db.execute(query);
  return executed.rows as CoverTemplate[];
};

export const getCoverTemplatesWithType = async (
  limit: number,
  cursor?: string,
  tagId?: string,
) => {
  const filters: SQLWrapper[] = [];

  if (tagId) {
    const contains = `JSON_CONTAINS(tags, '"${tagId}"')`;
    filters.push(sql.raw(contains));
  }

  const request = db
    .select({
      CoverTemplate: CoverTemplateTable,
      CoverTemplateType: CoverTemplateTypeTable,
      cursor: CoverTemplateTable.id,
    })
    .from(CoverTemplateTable)
    .innerJoin(
      CoverTemplateTypeTable,
      eq(CoverTemplateTypeTable.id, CoverTemplateTable.type),
    )
    .where(and(...filters))
    .orderBy((asc(CoverTemplateTypeTable.order), asc(CoverTemplateTable.order)))
    .limit(limit);

  const rows = await (cursor
    ? request.having(item => gt(item.cursor, cursor))
    : request);

  return rows.map(({ CoverTemplate, cursor }) => ({
    ...CoverTemplate,
    cursor,
  }));
};
