import { createId } from '@paralleldrive/cuid2';
import db from './db';
import { getEntitiesByIds, jsonFieldSerializer } from './generic';
import type { Database } from './db';
import type { CardModule } from '@prisma/client';
import type { QueryCreator } from 'kysely';

/**
 * Retrieve a list of card modules by their ids
 * @param ids - The ids of the card modules to retrieve
 * @returns A list of card modules, where the order of the card modules matches the order of the ids
 */
export const getCardModulesByIds = (
  ids: readonly string[],
): Promise<Array<CardModule | null>> => getEntitiesByIds('CardModule', ids);

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
  let query = db
    .selectFrom('CardModule')
    .selectAll()
    .where('cardId', '=', cardId);

  if (!includeHidden) {
    query = query.where('visible', '=', true);
  }
  query = query.orderBy('position', 'asc');

  return query.execute();
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
    .selectFrom('CardModule')
    .select(db.fn.countAll<number>().as('count'))
    .where('cardId', '=', cardId)
    .executeTakeFirstOrThrow()
    .then(({ count }) => count);

/**
 * Create a cardmodule.
 *
 * @param values - the card fields, excluding the id and the cardDate
 * @param qc - The query creator to use (profile for transactions)
 * @returns The created card
 */
export const createCardModule = async (
  values: Omit<CardModule, 'id'>,
  qc: QueryCreator<Database> = db,
): Promise<CardModule> => {
  const cardModule = {
    id: createId(),
    ...cardModuleSerializer(values),
  };
  await qc.insertInto('CardModule').values(cardModule).execute();
  return cardModule;
};

/**
 * Create a cardmodule.
 *
 * @param values - the card fields, excluding the id and the cardDate
 * @param qc - The query creator to use (profile for transactions)
 * @returns The created card
 */
export const updateCardModule = async (
  id: string,
  values: Partial<Omit<CardModule, 'id'>>,
  qc: QueryCreator<Database> = db,
): Promise<void> => {
  await qc
    .updateTable('CardModule')
    .set(cardModuleSerializer(values))
    .where('id', '=', id)
    .execute();
};

const jsonFields = ['data'] as const;

const cardModuleSerializer = jsonFieldSerializer(jsonFields);
