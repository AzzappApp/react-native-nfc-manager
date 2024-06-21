import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm';
import { CoverTemplatePreviewTable } from '#coverTemplatePreview';
import { CoverTemplateTypeTable } from '#coverTemplateType';
import db, { cols } from './db';
import { createId } from './helpers/createId';
import type {
  InferInsertModel,
  InferSelectModel,
  SQLWrapper,
} from 'drizzle-orm';

export type CoverAnimation = {
  name?: string;
  start: number;
  end: number;
};

export type CoverTextType = 'custom' | 'firstName' | 'mainName';

export type CoverText = {
  text: CoverTextType;
  customText?: string;
  fontFamily: string;
  color: string;
  fontSize: number;
  width: number;
  orientation: number;
  position: {
    x: number;
    y: number;
  };
  animation: CoverAnimation;
};

export type CoverOverlay = {
  media?: {
    id?: string;
  };
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  bounds: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  filter: string;
  rotation: number;
};

export type SocialLinks = {
  links: Array<string | undefined>;
  color: string;
};

export type CoverTemplateParams = {
  textLayers: CoverText[];
  overlayLayers: CoverOverlay[];
  linksLayer: SocialLinks;
};

export const CoverTemplateTable = cols.table('CoverTemplate', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  name: cols.defaultVarchar('name').notNull(),
  order: cols.int('order').notNull().default(1),
  tags: cols.json('tags').$type<string[]>().notNull(),
  type: cols.cuid('type').notNull(),
  lottieId: cols.cuid('lottieId').notNull(),
  previewId: cols.cuid('previewId').notNull(),
  colorPaletteId: cols.cuid('colorPaletteId').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
  params: cols.json('params').$type<CoverTemplateParams>(),
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

export const getCoverTemplatesWithType = async ({
  limit,
  cursor,
  tagId,
  companyActivityId,
}: {
  limit: number;
  cursor?: string;
  tagId?: string;
  companyActivityId?: string | null;
}) => {
  const filters: SQLWrapper[] = [];

  if (tagId) {
    const contains = `JSON_CONTAINS(tags, '"${tagId}"')`;
    filters.push(sql.raw(contains));
  }

  const request = db
    .select({
      CoverTemplate: CoverTemplateTable,
      CoverTemplateType: CoverTemplateTypeTable,
      CoverTemplatePreviewMediaId: CoverTemplatePreviewTable.media,
      cursor: CoverTemplateTable.id,
    })
    .from(CoverTemplateTable)
    .innerJoin(
      CoverTemplateTypeTable,
      eq(CoverTemplateTypeTable.id, CoverTemplateTable.type),
    )
    .leftJoin(
      CoverTemplatePreviewTable,
      eq(CoverTemplateTable.id, CoverTemplatePreviewTable.coverTemplateId),
    )
    .where(
      and(
        ...filters,
        companyActivityId
          ? eq(CoverTemplatePreviewTable.companyActivityId, companyActivityId)
          : isNull(CoverTemplatePreviewTable.companyActivityId),
      ),
    )
    .orderBy((asc(CoverTemplateTypeTable.order), asc(CoverTemplateTable.order)))
    .limit(limit);

  const rows = await (cursor
    ? request.having(item => gt(item.cursor, cursor))
    : request);

  return rows.map(({ CoverTemplate, CoverTemplatePreviewMediaId, cursor }) => ({
    ...CoverTemplate,
    previewId: CoverTemplatePreviewMediaId ?? CoverTemplate.previewId,
    cursor,
  }));
};

/**
 * Create a new cover template
 * @param data - The user fields, excluding the id
 * @returns The newly created user
 */
export const createCoverTemplate = async (data: NewCoverTemplate) => {
  const id = data.id ?? createId();
  await db
    .client()
    .insert(CoverTemplateTable)
    .values({ ...data, id });
  return id;
};

export const updateCoverTemplate = async (
  coverTemplateId: string,
  data: Partial<CoverTemplate>,
): Promise<void> => {
  await db
    .update(CoverTemplateTable)
    .set(data)
    .where(eq(CoverTemplateTable.id, coverTemplateId));
};
