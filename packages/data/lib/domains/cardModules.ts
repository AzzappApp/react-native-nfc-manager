import db from './db';
import type { CardModule } from '@prisma/client';

/**
 * Retrieve all card modules for a given card
 *
 * @param cardId - The card id
 * @returns The card modules
 */
export const getCardModules = async (cardId: string): Promise<CardModule[]> =>
  db
    .selectFrom('CardModule')
    .selectAll()
    .where('cardId', '=', cardId)
    .execute();
