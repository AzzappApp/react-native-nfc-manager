import { createId } from '@paralleldrive/cuid2';
import { inArray, and, eq } from 'drizzle-orm';
import { datetime, index, varchar } from 'drizzle-orm/mysql-core';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
  mysqlTable,
} from './db';
import { customTinyInt, sortEntitiesByIds } from './generic';
import type { DbTransaction } from './db';
import type { InferModel } from 'drizzle-orm';

export const CardTable = mysqlTable(
  'Card',
  {
    id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH })
      .primaryKey()
      .notNull(),
    isMain: customTinyInt('isMain').notNull(),
    coverId: varchar('coverId', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
    createdAt: datetime('createdAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
    profileId: varchar('profileId', {
      length: DEFAULT_VARCHAR_LENGTH,
    }).notNull(),
    updatedAt: datetime('updatedAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
    backgroundColor: varchar('backgroundColor', {
      length: DEFAULT_VARCHAR_LENGTH,
    }),
  },
  table => {
    return {
      profileIdIdx: index('Card_profileId_idx').on(table.profileId),
    };
  },
);

export type Card = InferModel<typeof CardTable>;
export type NewCard = Omit<InferModel<typeof CardTable, 'insert'>, 'id'>;

/**
 * Retrieve a list of card by their ids
 * @param ids - The ids of the card to retrieve
 * @returns A list of card, where the order of the card matches the order of the ids
 */
export const getCardsByIds = async (ids: readonly string[]) =>
  sortEntitiesByIds(
    ids,
    await db
      .select()
      .from(CardTable)
      .where(inArray(CardTable.id, ids as string[])),
  );

/**
 * Retrieve the main card for a list of profiles
 * @param profileIds - The ids of the profiles to retrieve the main card for
 * @returns A list of card, where the order of the card matches the order of the profileIds
 */
export const getUsersCards = async (profileIds: string[]) => {
  return db
    .select()
    .from(CardTable)
    .where(
      and(inArray(CardTable.profileId, profileIds), eq(CardTable.isMain, true)),
    );
};

/**
 * Create a card.
 *
 * @param values - the card fields, excluding the id and the cardDate
 * @param tx - The query creator to use (profile for transactions)
 * @returns The created card
 */
export const createCard = async (values: NewCard, tx: DbTransaction = db) => {
  const addedCard = {
    ...values,
    id: createId(),
  };

  await tx.insert(CardTable).values(addedCard);
  // TODO should we return the card from the database instead? createdAt might be different
  return {
    ...addedCard,
    backgroundColor: addedCard.backgroundColor ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Update a card.
 *
 * @param id - The id of the card to update
 * @param values - the card fields, excluding the id and the cardDate
 * @param tx - The query creator to use (profile for transactions)
 */
export const updateCard = async (
  id: string,
  values: Partial<Card>,
  tx: DbTransaction = db,
) => {
  await tx
    .update(CardTable)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(CardTable.id, id));
};
