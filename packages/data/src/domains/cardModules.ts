import { createId } from '@paralleldrive/cuid2';
import { inArray, eq, asc, sql, and } from 'drizzle-orm';
import {
  int,
  mysqlEnum,
  index,
  mysqlTable,
  json,
  boolean,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import { sortEntitiesByIds } from './generic';
import type { DbTransaction } from './db';
import type {
  CardModuleBlockTextData,
  CardModuleCarouselData,
  CardModuleHorizontalPhotoData,
  CardModulePhotoWithTextAndTitleData,
  CardModuleSimpleButtonData,
  CardModuleSimpleTextData,
  CardModuleSocialLinksData,
  CardModuleLineDividerData,
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_SCHEDULE,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
  MODULE_KIND_WEB_CARDS_CAROUSEL,
  MODULE_KIND_PARALLAX,
  MODULE_KIND_VIDEO,
  MODULE_KIND_IMAGEGRID,
} from '@azzapp/shared/cardModuleHelpers';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const CardModuleTable = mysqlTable(
  'CardModule',
  {
    id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
    webCardId: cols.cuid('webCardId').notNull(),
    kind: mysqlEnum('kind', [
      'blockText',
      'carousel',
      'horizontalPhoto',
      'imageGrid',
      'lineDivider',
      'parallax',
      'photoWithTextAndTitle',
      'schedule',
      'simpleButton',
      'simpleText',
      'simpleTitle',
      'socialLinks',
      'video',
      'webCardsCarousel',
    ]).notNull(),
    data: json('data').$type<any>().notNull(),
    position: int('position').notNull(),
    visible: boolean('visible').default(true).notNull(),
  },
  table => {
    return {
      webCardIdIdx: index('CardModule_webCardId_idx').on(table.webCardId),
    };
  },
);

export type CardModuleBase = Omit<
  InferSelectModel<typeof CardModuleTable>,
  'data' | 'kind'
>;

export type CardModuleBlockText = CardModuleBase & {
  kind: typeof MODULE_KIND_BLOCK_TEXT;
  data: CardModuleBlockTextData;
};

export type CardModuleCarousel = CardModuleBase & {
  kind: typeof MODULE_KIND_CAROUSEL;
  data: CardModuleCarouselData;
};

export type CardModuleHorizontalPhoto = CardModuleBase & {
  kind: typeof MODULE_KIND_HORIZONTAL_PHOTO;
  data: CardModuleHorizontalPhotoData;
};

export type CardModuleLineDivider = CardModuleBase & {
  kind: typeof MODULE_KIND_LINE_DIVIDER;
  data: CardModuleLineDividerData;
};

export type CardModuleSchedule = CardModuleBase & {
  kind: typeof MODULE_KIND_SCHEDULE;
  data: unknown;
};

export type CardModuleParrallax = CardModuleBase & {
  kind: typeof MODULE_KIND_PARALLAX;
  data: unknown;
};

export type CardModuleVideo = CardModuleBase & {
  kind: typeof MODULE_KIND_VIDEO;
  data: unknown;
};

export type CardModuleImageGrid = CardModuleBase & {
  kind: typeof MODULE_KIND_IMAGEGRID;
  data: unknown;
};

export type CardModulePhotoWithTextAndTitle = CardModuleBase & {
  kind: typeof MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE;
  data: CardModulePhotoWithTextAndTitleData;
};

export type CardModuleSimpleButton = CardModuleBase & {
  kind: typeof MODULE_KIND_SIMPLE_BUTTON;
  data: CardModuleSimpleButtonData;
};

export type CardModuleSimpleText = CardModuleBase & {
  kind: typeof MODULE_KIND_SIMPLE_TEXT | typeof MODULE_KIND_SIMPLE_TITLE;
  data: CardModuleSimpleTextData;
};

export type CardModuleSocialLinks = CardModuleBase & {
  kind: typeof MODULE_KIND_SOCIAL_LINKS;
  data: CardModuleSocialLinksData;
};

export type CardModuleWebCardsCarousel = CardModuleBase & {
  kind: typeof MODULE_KIND_WEB_CARDS_CAROUSEL;
  data: unknown;
};

export type CardModule =
  | CardModuleBlockText
  | CardModuleCarousel
  | CardModuleHorizontalPhoto
  | CardModuleImageGrid
  | CardModuleLineDivider
  | CardModuleParrallax
  | CardModulePhotoWithTextAndTitle
  | CardModuleSchedule
  | CardModuleSimpleButton
  | CardModuleSimpleText
  | CardModuleSocialLinks
  | CardModuleVideo
  | CardModuleWebCardsCarousel;

export type NewCardModule = InferInsertModel<typeof CardModuleTable>;

/**
 * Retrieve a list of card modules by their ids
 * @param ids - The ids of the card modules to retrieve
 * @returns A list of card modules, where the order of the card modules matches the order of the ids
 */
export const getCardModulesByIds = async (ids: string[]) =>
  sortEntitiesByIds(
    ids,
    await db
      .select()
      .from(CardModuleTable)
      .where(inArray(CardModuleTable.id, ids)),
  );

export const getCardModulesSortedByPosition = (ids: string[]) =>
  db
    .select()
    .from(CardModuleTable)
    .where(inArray(CardModuleTable.id, ids))
    .orderBy(asc(CardModuleTable.position));

/**
/**
 * Retrieve all card modules for a given card
 *
 * @param webCardId - The card id
 * @returns The card modules
 */
export const getCardModules = async (
  webCardId: string,
  includeHidden = false,
  trx: DbTransaction = db,
): Promise<CardModule[]> =>
  trx
    .select()
    .from(CardModuleTable)
    .where(
      and(
        eq(CardModuleTable.webCardId, webCardId),
        includeHidden ? undefined : eq(CardModuleTable.visible, true),
      ),
    )
    .orderBy(asc(CardModuleTable.position));

/**
 * Create a cardmodule.
 *
 * @param values - the card fields, excluding the id and the cardDate
 * @param qc - The query creator to use (profile for transactions)
 * @returns The created card
 */
export const getCardModuleCount = async (webCardId: string) =>
  db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(CardModuleTable)
    .where(eq(CardModuleTable.webCardId, webCardId))
    .then(res => res[0].count);

/**
 * find the last position the a new card module.
 *
 * @param values - the card fields, excluding the id and the cardDate
 * @param qc - The query creator to use (profile for transactions)
 * @returns The created card
 */
export const getCardModuleNextPosition = async (webCardId: string) =>
  db
    .select({
      maxPosition: sql`max(${CardModuleTable.position})`.mapWith(Number),
    })
    .from(CardModuleTable)
    .where(eq(CardModuleTable.webCardId, webCardId))
    .then(res => res[0].maxPosition + 1);

/**
 * Create a cardmodule.
 *
 * @param values - the card fields, excluding the id and the cardDate
 * @param tx - The query creator to use (profile for transactions)
 * @returns The created card
 */
export const createCardModule = async (
  values: NewCardModule,
  tx: DbTransaction = db,
) => {
  const id = createId();
  await tx.insert(CardModuleTable).values({ ...values, id });
  return id;
};

export const createCardModules = async (
  values: NewCardModule[],
  tx: DbTransaction = db,
) => {
  const createdModules = values.map(v => ({ ...v, id: createId() }));
  await tx.insert(CardModuleTable).values(createdModules);
  return createdModules.map(m => m.id);
};

/**
 * Create a cardmodule.
 *
 * @param values - the card fields, excluding the id and the cardDate
 * @param tx - The query creator to use (profile for transactions)
 * @returns The created card
 */
export const updateCardModule = async (
  id: string,
  values: Partial<CardModule>,
  tx: DbTransaction = db,
) => {
  await tx
    .update(CardModuleTable)
    .set(values)
    .where(eq(CardModuleTable.id, id));
};

/**
 * Reset all card modules positions to match their order in the array
 */
export const resetCardModulesPositions = async (
  webCardId: string,
  trx: DbTransaction = db,
) => {
  const modules = await getCardModules(webCardId, true, trx);
  await Promise.all(
    modules.map((module, index) =>
      trx
        .update(CardModuleTable)
        .set({ position: index })
        .where(eq(CardModuleTable.id, module.id)),
    ),
  );
};
