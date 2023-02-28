import * as uuid from 'uuid';
import db from './db';
import { getEntitiesByIds } from './generic';
import type { Database } from './db';
import type { Card } from '@prisma/client';
import type { QueryCreator } from 'kysely';

/**
 * Retrieve a list of cards by their ids
 * @param ids - The ids of the cards to retrieve
 * @returns A list of cards, where the order of the cards matches the order of the ids
 */
export const getCardsByIds = (
  ids: readonly string[],
): Promise<Array<Card | null>> => getEntitiesByIds('Card', ids);

/**
 * Retrieve the main card for a list of profiles
 * @param profileIds - The ids of the profiles to retrieve the main card for
 * @returns A list of cards, where the order of the cards matches the order of the profileIds
 */
export const getUsersCards = async (profileIds: readonly string[]) => {
  const cards = await db
    .selectFrom('Card')
    .selectAll()
    .where('profileId', 'in', profileIds)
    .where('isMain', '=', true)
    .execute();

  const cardsMap = new Map(cards.map(card => [card.profileId, card]));

  return profileIds.map(id => cardsMap.get(id) ?? null);
};

/**
 * Create a card.
 *
 * @param values - the card fields, excluding the id and the cardDate
 * @param qc - The query creator to use (profile for transactions)
 * @returns The created card
 */
export const createCard = async (
  values: Omit<Card, 'createdAt' | 'id' | 'updatedAt'>,
  qc: QueryCreator<Database> = db,
): Promise<Card> => {
  const card = {
    id: uuid.v4(),
    ...values,
  };
  await qc.insertInto('Card').values(card).execute();
  // TODO should we return the card from the database instead? createdAt might be different
  return {
    ...card,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
