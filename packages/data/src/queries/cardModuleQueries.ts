import { inArray, eq, asc, and, sql } from 'drizzle-orm';
import { db } from '../database';
import { CardModuleTable } from '../schema';
import { getEntitiesByIds } from './entitiesQueries';
import type { CardModule } from '../schema';
import type { InferInsertModel, SQL } from 'drizzle-orm';

/**
 * Retrieve a set of car modules by their ids
 *
 * @param ids - The ids of the card modules to retrieve
 * @returns
 *  An array corresponding to the ids provided with for each index
 *  the corresponding card module if it exists
 */
export const getCardModulesByIds = async (
  ids: string[],
): Promise<Array<CardModule | null>> => getEntitiesByIds('CardModule', ids);

/**
 * Retrieve the card module associated with a given web card
 *
 * @param webCardId - The web card id
 * @param includeHidden - Whether to include hidden card modules
 * @returns The card modules associated with the given web card sorted by their position field
 */
export const getCardModulesByWebCard = (
  webCardId: string,
  includeHidden = false,
): Promise<CardModule[]> =>
  db()
    .select()
    .from(CardModuleTable)
    .where(
      and(
        eq(CardModuleTable.webCardId, webCardId),
        includeHidden ? undefined : eq(CardModuleTable.visible, true),
      ),
    )
    .orderBy(asc(CardModuleTable.position));

export const getCardModulesByWebCards = async (
  webCardIds: string[],
): Promise<Record<string, CardModule[]>> => {
  if (webCardIds.length === 0) {
    return {};
  }
  if (webCardIds.length === 1) {
    const modules = await getCardModulesByWebCard(webCardIds[0], true);
    return { [webCardIds[0]]: modules };
  }
  const modules = await db()
    .select()
    .from(CardModuleTable)
    .where(inArray(CardModuleTable.webCardId, webCardIds))
    .orderBy(asc(CardModuleTable.position));

  return modules.reduce(
    (acc, module) => {
      if (!acc[module.webCardId]) {
        acc[module.webCardId] = [];
      }
      acc[module.webCardId].push(module);
      return acc;
    },
    {} as Record<string, CardModule[]>,
  );
};

/**
 * Find the next position for a card module in a given web card
 *
 * @param webCardId - the id of the web card
 * @returns the next position for a card module in the given web card
 */
export const getCardModuleNextPosition = async (webCardId: string) =>
  db()
    .select({
      maxPosition: sql`max(${CardModuleTable.position})`.mapWith(Number),
    })
    .from(CardModuleTable)
    .where(eq(CardModuleTable.webCardId, webCardId))
    .then(res => res[0].maxPosition + 1);

/**
 * Insert a card module into the database
 *
 * @param values - the card module fields
 * @returns the id of the inserted CardModule
 */
export const createCardModule = (
  values: InferInsertModel<typeof CardModuleTable>,
) =>
  db()
    .insert(CardModuleTable)
    .values(values)
    .$returningId()
    .then(res => res[0].id);

/**
 * Insert multiple card modules into the database
 *
 * @param values - an array of card module fields
 * @returns the ids of the inserted card modules
 */
export const createCardModules = (
  values: Array<InferInsertModel<typeof CardModuleTable>>,
) =>
  db()
    .insert(CardModuleTable)
    .values(values)
    .$returningId()
    .then(res => res.map(r => r.id));

/**
 * Update a card module
 *
 * @param id - the id of the card module to update
 * @param values - the card module fields to update
 */
export const updateCardModule = async (
  id: string,
  values: Partial<Omit<CardModule, 'id' | 'webCardId'>>,
) => {
  await db()
    .update(CardModuleTable)
    .set(values)
    .where(eq(CardModuleTable.id, id));
};

/**
 * Update a set of card modules
 * @param ids - the ids of the card modules to update
 * @param values - the card module fields to update
 */
export const updateCardModules = async (
  ids: string[],
  values: Partial<Omit<CardModule, 'id' | 'webCardId'>>,
) => {
  await db()
    .update(CardModuleTable)
    .set(values)
    .where(inArray(CardModuleTable.id, ids));
};

/**
 * Update the position of a set of card modules
 *
 * @param ids - The ids of the card modules to update
 * @param increment - The increment to apply to the position of the card modules
 */
export const updateCardModulesPosition = async (
  webCardId: string,
  ids: string[],
  increment: number,
) => {
  await db()
    .update(CardModuleTable)
    .set({
      position: sql`${CardModuleTable.position} + ${increment}`,
    })
    .where(
      and(
        eq(CardModuleTable.webCardId, webCardId),
        inArray(CardModuleTable.id, ids),
      ),
    );
};

/**
 * Reset all card modules positions to match their selection order
 * for a given web card
 *
 * @param webCardId - The id of the web card to reset the card module positions for
 */
export const resetCardModulesPositions = async (webCardId: string) => {
  const modules = await getCardModulesByWebCard(webCardId, true);
  const isOrdered = modules.every((module, i) => {
    return module.position === i;
  });

  if (!isOrdered) {
    const positionChunk: SQL[] = [];
    const ids: string[] = [];

    modules.forEach((module, index) => {
      positionChunk.push(sql`when id = ${module.id} then ${index}`);
      ids.push(module.id);
    });

    const position: SQL = sql.join(
      [sql`(case`, ...positionChunk, sql`end)`],
      sql.raw(' '),
    );

    await db()
      .update(CardModuleTable)
      .set({ position })
      .where(inArray(CardModuleTable.id, ids));
  }
};

/**
 * Delete a set of card modules
 *
 * @param cardModuleIds - The ids of the card modules to delete
 */
export const removeCardModules = async (cardModuleIds: string[]) => {
  await db()
    .delete(CardModuleTable)
    .where(inArray(CardModuleTable.id, cardModuleIds));
};
