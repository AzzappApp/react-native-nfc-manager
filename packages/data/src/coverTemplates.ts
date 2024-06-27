import { and, eq, sql } from 'drizzle-orm';
import { CoverTemplatePreviewTable } from '#coverTemplatePreview';
import {
  CoverTemplateTypeTable,
  type CoverTemplateType,
} from '#coverTemplateType';
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
  animation: CoverAnimation;
};

export type SocialLinks = {
  links: Array<string | undefined>;
  color: string;
};

export type CoverTemplateParams = {
  medias: Array<{ id: string }> | null;
  textLayers: CoverText[];
  overlayLayers: CoverOverlay[];
  linksLayer: SocialLinks;
};

export const CoverTemplateTable = cols.table('CoverTemplate', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  name: cols.defaultVarchar('name').notNull(),
  order: cols.int('order').notNull().default(1),
  tags: cols.json('tags').$type<string[]>().notNull(),
  typeId: cols.cuid('typeId').notNull(),
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

export const getCoverTemplatesByType = (typeId: string) =>
  db
    .select()
    .from(CoverTemplateTable)
    .where(eq(CoverTemplateTable.typeId, typeId));

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

export const getCoverTemplatesByTypes = async ({
  limit,
  cursor,
  tagId,
  companyActivityId,
}: {
  limit: number;
  cursor?: number;
  tagId?: string;
  companyActivityId?: string | null;
}) => {
  const filters: SQLWrapper[] = [];

  if (tagId) {
    const contains = `JSON_CONTAINS(tags, '"${tagId}"')`;
    filters.push(sql.raw(contains));
  }

  //KEEP THE SQL command temporary until the feature is validated
  // let query = sql`
  // SELECT
  //    t.id, t.name, t.tags, COALESCE(t.previewId, c.mediaId) AS previewId, t.typeId, t.order, t.colorPaletteId, t.lottieId, t.params, t.enabled, tt.order AS typeOrder, tt.labelKey
  // FROM (
  //   SELECT  ctt.*
  //   FROM CoverTemplateType ctt
  //   JOIN CoverTemplate ct ON ctt.id = ct.typeId
  //   WHERE ctt.enabled = TRUE
  //   GROUP BY ctt.id
  //   ORDER BY ctt.order
  //   LIMIT ${limit}
  //   OFFSET ${cursor ?? 0}
  // ) AS tt
  // JOIN CoverTemplate AS t ON tt.id = t.typeId and t.enabled = TRUE
  // LEFT JOIN CoverTemplatePreview AS c ON tt.id = c.coverTemplateId AND c.companyActivityId = ${companyActivityId}`;

  // // Dynamically append filters if any
  // if (filters.length > 0) {
  //   query = sql`${query} WHERE ${sql.join(filters, sql.raw(' AND '))}`;
  // }

  // // Finalize the query with ordering
  // query = sql`${query} ORDER BY tt.order, t.order`;
  // const rows = (await db.execute(query)).rows as Array<
  //   CoverTemplate & { typeOrder: number; labelKey: string }
  // >;

  //doing it with drizzle orm

  const coverTemplateTypeSubquery = db
    .select({
      id: CoverTemplateTypeTable.id,
      typeOrder: CoverTemplateTypeTable.order,
      labelKey: CoverTemplateTypeTable.labelKey,
    })
    .from(CoverTemplateTypeTable)
    .innerJoin(
      CoverTemplateTable,
      eq(CoverTemplateTypeTable.id, CoverTemplateTable.typeId),
    )
    .where(eq(CoverTemplateTypeTable.enabled, true))
    .groupBy(CoverTemplateTypeTable.id)
    .orderBy(CoverTemplateTypeTable.order)
    .limit(limit)
    .offset(cursor ?? 0)
    .as('coverTemplateTypeSubquery');

  const queryDrizzle = db
    .select({
      id: CoverTemplateTable.id,
      name: CoverTemplateTable.name,
      tags: CoverTemplateTable.tags,
      previewId: sql`COALESCE(${CoverTemplateTable.previewId}, ${CoverTemplatePreviewTable.mediaId})`,
      typeId: CoverTemplateTable.typeId,
      order: CoverTemplateTable.order,
      colorPaletteId: CoverTemplateTable.colorPaletteId,
      lottieId: CoverTemplateTable.lottieId,
      params: CoverTemplateTable.params,
      enabled: CoverTemplateTable.enabled,
      typeOrder: coverTemplateTypeSubquery.typeOrder,
      labelKey: coverTemplateTypeSubquery.labelKey,
    })
    .from(CoverTemplateTable)
    .innerJoin(
      coverTemplateTypeSubquery,
      eq(coverTemplateTypeSubquery.id, CoverTemplateTable.typeId),
    )
    .leftJoin(
      CoverTemplatePreviewTable,
      and(
        eq(
          coverTemplateTypeSubquery.id,
          CoverTemplatePreviewTable.coverTemplateId,
        ),
        companyActivityId
          ? eq(CoverTemplatePreviewTable.companyActivityId, companyActivityId)
          : undefined,
      ),
    );

  if (filters.length > 0) {
    queryDrizzle.where(sql`${sql.join(filters, sql.raw(' AND '))}`);
  }

  queryDrizzle.orderBy(
    coverTemplateTypeSubquery.typeOrder,
    CoverTemplateTable.order,
  );

  const rows = await queryDrizzle.execute();

  const groupedAndOrdered = rows.reduce(
    (acc, curr) => {
      // Initialize the group if it doesn't exist
      if (!acc[curr.typeId]) {
        acc[curr.typeId] = {
          id: curr.typeId,
          order: curr.typeOrder,
          enabled: true,
          labelKey: curr.labelKey,
          data: [],
        };
      }

      // Push the current template into the correct group
      acc[curr.typeId].data.push({
        id: curr.id,
        name: curr.name,
        tags: curr.tags,
        previewId: curr.previewId as string,
        order: curr.order,
        colorPaletteId: curr.colorPaletteId,
        lottieId: curr.lottieId,
        params: curr.params,
        enabled: curr.enabled,
        typeId: curr.typeId,
      });

      return acc;
    },
    {} as Record<
      string,
      CoverTemplateType & { data: Array<CoverTemplate | null> }
    >,
  );

  return Object.values(groupedAndOrdered).filter(a => a.data.length > 0);

  // Optionally, sort templates within each group if needed
  // return Object.values(groupedAndOrdered).forEach(group => {
  //   group.templates.sort((a, b) => a.order - b.order);
  // });
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
