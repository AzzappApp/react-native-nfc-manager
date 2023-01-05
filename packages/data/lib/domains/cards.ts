import db from './db';
import { getEntitiesByIds } from './generic';
import type { Card } from '@prisma/client';

/**
 * Retrieve a list of cards by their ids
 * @param ids - The ids of the cards to retrieve
 * @returns A list of cards, where the order of the cards matches the order of the ids
 */
export const getCardsByIds = (
  ids: readonly string[],
): Promise<Array<Card | null>> => getEntitiesByIds('Card', ids);

/**
 * Retrieve the main card for a list of users
 * @param userIds
 * @returns A list of cards, where the order of the cards matches the order of the userIds
 */
export const getUsersCards = async (userIds: readonly string[]) => {
  const cards = await db
    .selectFrom('Card')
    .selectAll()
    .where('userId', 'in', userIds)
    .where('isMain', '=', true)
    .execute();

  const cardsMap = new Map(cards.map(card => [card.userId, card]));

  return userIds.map(id => cardsMap.get(id) ?? null);
};
