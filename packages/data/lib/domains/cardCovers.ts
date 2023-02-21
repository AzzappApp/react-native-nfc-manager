import * as uuid from 'uuid';
import db from './db';
import { getEntitiesByIds, jsonFieldSerializer } from './generic';
import type { Database } from './db';
import type { CardCover } from '@prisma/client';
import type { QueryCreator } from 'kysely';

/**
 * Retrieve a list of covers by their ids
 * @param ids - The ids of the covers to retrieve
 * @returns A list of covers, where the order of the covers matches the order of the ids
 */
export const getCardCoversByIds = (
  ids: readonly string[],
): Promise<Array<CardCover | null>> => getEntitiesByIds('CardCover', ids);

/**
 * Create a card cover.
 *
 * @param values - the cardCover fields, excluding the id and the cardCoverDate
 * @param qc - The query creator to use (profile for transactions)
 * @returns The created cardCover
 */
export const createCardCover = async (
  values: Omit<CardCover, 'createdAt' | 'id' | 'updatedAt'>,
  qc: QueryCreator<Database> = db,
): Promise<CardCover> => {
  const cardCover = cardSerializer({
    id: uuid.v4(),
    ...values,
  });
  await qc.insertInto('CardCover').values(cardCover).execute();
  // TODO should we return the cardCover from the database instead? createdAt might be different
  return {
    ...cardCover,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export type CoverUpdates = Partial<
  Omit<CardCover, 'createdAt' | 'id' | 'updatedAt'>
>;

/**
 * Create a card cover.
 *
 * @param values - the cardCover fields, excluding the id and the cardCoverDate
 * @param qc - The query creator to use (profile for transactions)
 * @returns The created cardCover
 */
export const updateCardCover = async (
  id: string,
  updates: CoverUpdates,
  qc: QueryCreator<Database> = db,
): Promise<void> => {
  await qc
    .updateTable('CardCover')
    .where('id', '=', id)
    .set({
      updatedAt: new Date(),
      ...cardSerializer(updates),
    })
    .execute();
};

const jsonFields = [
  'mediaStyle',
  'backgroundStyle',
  'foregroundStyle',
  'contentStyle',
  'titleStyle',
  'subTitleStyle',
] as const;

const cardSerializer = jsonFieldSerializer(jsonFields);
