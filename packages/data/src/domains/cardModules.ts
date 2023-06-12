import { createId } from '@paralleldrive/cuid2';
import { inArray, eq, asc, sql, and } from 'drizzle-orm';
import { int, varchar, index, customType } from 'drizzle-orm/mysql-core';
import db, { DEFAULT_VARCHAR_LENGTH, mysqlTable } from './db';
import { customTinyInt } from './generic';
import type { DbTransaction } from './db';
import type { InferModel } from 'drizzle-orm';

export const CardModuleTable = mysqlTable(
  'CardModule',
  {
    id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH })
      .primaryKey()
      .notNull(),
    kind: varchar('kind', {
      length: DEFAULT_VARCHAR_LENGTH,
      enum: [
        'blockText',
        'carousel',
        'horizontalPhoto',
        'lineDivider',
        'openingHours',
        'photoWithTextAndTitle',
        'simpleButton',
        'simpleText',
        'simpleTitle',
        'socialLinks',
        'webCardsCarousel',
      ],
    }).notNull(),
    cardId: varchar('cardId', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
    data: customType<{
      data: ModuleData;
    }>({
      toDriver: value => JSON.stringify(value),
      fromDriver: value => value as ModuleData,
      dataType: () => 'json',
    })('data').notNull(),
    position: int('position').notNull(),
    visible: customTinyInt('visible').default(true).notNull(),
  },
  table => {
    return {
      cardIdIdx: index('CardModule_cardId_idx').on(table.cardId),
    };
  },
);

export type CardModule = InferModel<typeof CardModuleTable>;

export type NewCardModule = Omit<
  InferModel<typeof CardModuleTable, 'insert'>,
  'id'
>;

type ModuleData = {
  gap?: number | null;
  backgroundStyle?: {
    backgroundColor?: string;
    opacity?: number;
    patternColor?: string;
  } | null;
  backgroundImage?: string | null;
  borderColor?: string | null;
  borderRadius?: number | null;
  borderSize?: number | null;
  imageHeight?: number | null;
  squareRatio?: boolean | null;
  color?: string | null;
  fontFamily?: string | null;
  marginHorizontal?: number | null;
  marginVertical?: number | null;
  fontSize?: number | null;
  textAlign?: string | null;
  text?: string | null;
  verticalSpacing?: number | null;
  actionType?: string | null;
  actionLink?: string | null;
  borderWidth?: number | null;
  buttonColor?: string | null;
  buttonLabel?: string | null;
  fontColor?: string | null;
  height?: number | null;
  marginBottom?: number | null;
  marginTop?: number | null;
  width?: number | null;
  title?: string | null;
  aspectRatio?: number | null;
  horizontalArrangement?: string | null;
  verticalArrangement?: string | null;
  imageMargin?: string | null;
  textSize?: number | null;
  links?: Array<{ socialId: string; link: string; position: number }> | null;
  iconColor?: string | null;
  arrangement?: string | null;
  iconSize?: number | null;
  columnGap?: number | null;
  images?: string[] | null;
  image?: string | null;
  textBackgroundId?: string | null;
  textMarginVertical?: number | null;
  textMarginHorizontal?: number | null;
  textBackgroundStyle?: {
    backgroundColor?: string;
    opacity?: number;
    patternColor?: string;
  } | null;
};

/**
 * Retrieve a list of card modules by their ids
 * @param ids - The ids of the card modules to retrieve
 * @returns A list of card modules, where the order of the card modules matches the order of the ids
 */
export const getCardModulesByIds = (ids: string[]): Promise<CardModule[]> =>
  db
    .select()
    .from(CardModuleTable)
    .where(inArray(CardModuleTable.id, ids))
    .execute();

/**
/**
 * Retrieve all card modules for a given card
 *
 * @param cardId - The card id
 * @returns The card modules
 */
export const getCardModules = async (
  cardId: string,
  includeHidden = false,
): Promise<CardModule[]> => {
  return db
    .select()
    .from(CardModuleTable)
    .where(
      and(
        eq(CardModuleTable.cardId, cardId),
        includeHidden ? undefined : eq(CardModuleTable.visible, true),
      ),
    )
    .where(eq(CardModuleTable.cardId, cardId))
    .orderBy(asc(CardModuleTable.position))
    .execute();
};

/**
 * Create a cardmodule.
 *
 * @param values - the card fields, excluding the id and the cardDate
 * @param qc - The query creator to use (profile for transactions)
 * @returns The created card
 */
export const getCardModuleCount = async (cardId: string): Promise<number> =>
  db

    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(CardModuleTable)
    .where(eq(CardModuleTable.cardId, cardId))
    .execute()
    .then(res => res[0].count);

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
): Promise<CardModule> => {
  const addedCardModule = {
    ...values,
    id: createId(),
  };
  await tx.insert(CardModuleTable).values(addedCardModule).execute();
  return { ...addedCardModule, visible: addedCardModule.visible ?? true };
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
): Promise<void> => {
  await tx
    .update(CardModuleTable)
    .set(values)
    .where(eq(CardModuleTable.id, id))
    .execute();
};
