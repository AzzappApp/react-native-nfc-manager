import { createId } from '@paralleldrive/cuid2';
import { inArray, eq } from 'drizzle-orm';
import {
  datetime,
  json,
  varchar,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
} from './db';
import { customTinyInt, sortEntitiesByIds } from './generic';
import type { DbTransaction } from './db';
import type { InferModel } from 'drizzle-orm';

export const CardCoverTable = mysqlTable('CardCover', {
  id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH }).primaryKey().notNull(),
  title: varchar('title', { length: DEFAULT_VARCHAR_LENGTH }),
  backgroundId: varchar('backgroundId', { length: DEFAULT_VARCHAR_LENGTH }),
  backgroundStyle: json('backgroundStyle'),
  contentStyle: json('contentStyle'),
  createdAt: datetime('createdAt', {
    mode: 'date',
    fsp: DEFAULT_DATETIME_PRECISION,
  })
    .default(DEFAULT_DATETIME_VALUE)
    .notNull(),
  foregroundId: varchar('foregroundId', { length: DEFAULT_VARCHAR_LENGTH }),
  foregroundStyle: json('foregroundStyle'),
  maskMediaId: varchar('maskMediaId', { length: DEFAULT_VARCHAR_LENGTH }),
  mediaId: varchar('mediaId', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
  mediaStyle: json('mediaStyle').notNull(),
  merged: customTinyInt('merged').notNull(),
  segmented: customTinyInt('segmented').notNull(),
  sourceMediaId: varchar('sourceMediaId', {
    length: DEFAULT_VARCHAR_LENGTH,
  }).notNull(),
  subTitle: varchar('subTitle', { length: DEFAULT_VARCHAR_LENGTH }),
  subTitleStyle: json('subTitleStyle'),
  textPreviewMediaId: varchar('textPreviewMediaId', {
    length: DEFAULT_VARCHAR_LENGTH,
  }),
  titleStyle: json('titleStyle'),
  updatedAt: datetime('updatedAt', {
    mode: 'date',
    fsp: DEFAULT_DATETIME_PRECISION,
  })
    .default(DEFAULT_DATETIME_VALUE)
    .notNull(),
});

export type CardCover = InferModel<typeof CardCoverTable>;
export type NewCardCover = Omit<
  InferModel<typeof CardCoverTable, 'insert'>,
  'id'
>;

/**
 * Retrieve a list of covers by their ids
 * @param ids - The ids of the covers to retrieve
 * @returns A list of covers, where the order of the covers matches the order of the ids
 */
export const getCardCoversByIds = async (ids: readonly string[]) =>
  sortEntitiesByIds(
    ids,
    await db
      .select()
      .from(CardCoverTable)
      .where(inArray(CardCoverTable.id, ids as string[])),
  );

/**
 * Create a card cover.
 *
 * @param values - the cardCover fields, excluding the id and the cardCoverDate
 * @param tx - The query creator to use (profile for transactions)
 * @returns The created cardCover
 */
export const createCardCover = async (
  values: NewCardCover,
  tx: DbTransaction = db,
) => {
  const addedCardCover = {
    ...values,
    id: createId(),
  };
  await tx.insert(CardCoverTable).values(addedCardCover);

  // TODO should we return the cardCover from the database instead? createdAt might be different
  return {
    ...addedCardCover,
    backgroundId: addedCardCover.backgroundId ?? null,
    backgroundStyle: addedCardCover.backgroundStyle ?? null,
    foregroundId: addedCardCover.foregroundId ?? null,
    foregroundStyle: addedCardCover.foregroundStyle ?? null,
    segmented: addedCardCover.segmented ?? false,
    merged: addedCardCover.merged ?? false,
    title: addedCardCover.title ?? null,
    titleStyle: addedCardCover.titleStyle ?? null,
    subTitle: addedCardCover.subTitle ?? null,
    subTitleStyle: addedCardCover.subTitleStyle ?? null,
    contentStyle: addedCardCover.contentStyle ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    maskMediaId: addedCardCover.maskMediaId ?? null,
  };
};

export type CoverUpdates = Partial<
  Omit<CardCover, 'createdAt' | 'id' | 'updatedAt'>
>;

/**
 * Create a card cover.
 *
 * @param values - the cardCover fields, excluding the id and the cardCoverDate
 * @param tx - The query creator to use (profile for transactions)
 * @returns The created cardCover
 */
export const updateCardCover = async (
  id: string,
  updates: CoverUpdates,
  tx: DbTransaction = db,
) => {
  await tx
    .update(CardCoverTable)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(CardCoverTable.id, id));
};
