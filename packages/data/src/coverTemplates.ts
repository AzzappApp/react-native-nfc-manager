import { and, eq, sql } from 'drizzle-orm';
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
  const tagIdJson = JSON.stringify([tagId]);
  const query = sql`
  SELECT *
  FROM CoverTemplate
  WHERE typeId = ${typeId}
  AND JSON_CONTAINS (tags, ${tagIdJson})`;

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
    })
    .from(CoverTemplateTable)
    .innerJoin(
      coverTemplateTypeSubquery,
      and(
        eq(coverTemplateTypeSubquery.id, CoverTemplateTable.typeId),
        eq(CoverTemplateTable.enabled, true),
      ),
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
  return rows;
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
