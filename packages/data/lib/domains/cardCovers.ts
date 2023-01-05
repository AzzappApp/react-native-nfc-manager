import { getEntitiesByIds } from './generic';
import type { CardCover } from '@prisma/client';

/**
 * Retrieve a list of covers by their ids
 * @param ids - The ids of the covers to retrieve
 * @returns A list of covers, where the order of the covers matches the order of the ids
 */
export const getCardCoversByIds = (
  ids: readonly string[],
): Promise<Array<CardCover | null>> => getEntitiesByIds('CardCover', ids);
