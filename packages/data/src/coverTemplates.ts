import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { CoverTemplatePreviewTable } from '#coverTemplatePreview';
import db, { cols } from './db';
import { createId } from './helpers/createId';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

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
  mediaCount: cols.int('mediaCount').notNull(),
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

export const getCoverTemplatesByTypesAndTag = async (
  typeIds: string[],
  tagId?: string | null,
  companyActivityId?: string | null,
) => {
  const tagIdJson = tagId ? JSON.stringify([tagId]) : null;

  if (typeIds.length === 0) return [];

  const query = db
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
    );

  return query.execute().then(rows =>
    rows.map(row => ({
      ...row.CoverTemplateTable,
      previewId: row.previewId as string,
    })),
  );
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
