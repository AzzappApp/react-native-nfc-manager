import { count, eq } from 'drizzle-orm';
import { db } from '../database';
import { CardTemplateTable, CardTemplateTypeTable } from '../schema';
import type { CardTemplateType } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieve a card template type by its id.
 *
 * @param id - The id of the cardTemplateType to retrieve
 * @returns the CardTemplateType, or null if no CardTemplateType was found
 */
export const getCardTemplateTypeById = (
  id: string,
): Promise<CardTemplateType | null> =>
  db()
    .select()
    .from(CardTemplateTypeTable)
    .where(eq(CardTemplateTypeTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Retrieve all card template types.
 *
 * @param enabledOnly - If true, only return enabled card template types (default: true)
 * @returns a list of all card template types that are enabled
 */
export const getCardTemplateTypes = async (
  enabledOnly = true,
): Promise<CardTemplateType[]> => {
  let query = db().select().from(CardTemplateTypeTable).$dynamic();
  if (enabledOnly) {
    query = query.where(eq(CardTemplateTypeTable.enabled, true));
  }
  return query;
};

/**
 * Retrieve all card template types with the count of templates that use them.
 *
 * @param enabledOnly - If true, only return enabled card template types (default: true)
 * @returns a list of all card template types that are enabled
 */
export const getCardTemplateTypesWithTemplatesCount = async (): Promise<
  Array<{
    cardTemplateType: CardTemplateType;
    templatesCount: number;
  }>
> =>
  db()
    .select({
      cardTemplateType: CardTemplateTypeTable,
      templatesCount: count(CardTemplateTable.id),
    })
    .from(CardTemplateTypeTable)
    .leftJoin(
      CardTemplateTable,
      eq(CardTemplateTable.cardTemplateTypeId, CardTemplateTypeTable.id),
    )
    .groupBy(CardTemplateTypeTable.id);

/**
 * update a card template type
 *
 * @param id - The id of the card template type to update
 * @param updates - The updates to apply to the card template type
 */
export const updateCardTemplateType = async (
  id: string,
  updates: Partial<CardTemplateType>,
): Promise<void> => {
  await db()
    .update(CardTemplateTypeTable)
    .set(updates)
    .where(eq(CardTemplateTypeTable.id, id));
};

export type NewCardTemplateType = InferInsertModel<
  typeof CardTemplateTypeTable
>;
/**
 * Create a new card template type
 *
 * @param newCardTemplateType - The new card template type to create
 * @returns the id of the newly created card template type
 */
export const createCardTemplateType = (
  newCardTemplateType: NewCardTemplateType,
): Promise<string> =>
  db()
    .insert(CardTemplateTypeTable)
    .values(newCardTemplateType)
    .$returningId()
    .then(rows => rows[0].id);
