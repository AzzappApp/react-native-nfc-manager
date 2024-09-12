import { eq, sql } from 'drizzle-orm';
import { db } from '../database';
import { CardTemplateTable } from '../schema';
import type { CardTemplate } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieve a card template by its id.
 *
 * @param id - The id of the card template to retrieve
 * @returns the card template or null if no card template was found
 */
export const getCardTemplateById = (id: string): Promise<CardTemplate | null> =>
  db()
    .select()
    .from(CardTemplateTable)
    .where(eq(CardTemplateTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Create a card template.
 *
 * @param newCardTemplate - the card template fields
 * @returns The id of the created card template
 */
export const createCardTemplate = async (
  newCardTemplate: InferInsertModel<typeof CardTemplateTable>,
) =>
  db()
    .insert(CardTemplateTable)
    .values(newCardTemplate)
    .$returningId()
    .then(res => res[0].id);

/**
 * Update a card template.
 *
 * @param id - The id of the card template to update
 * @param values - the card template fields to update
 */
export const updateCardTemplate = async (
  id: string,
  values: Partial<Omit<CardTemplate, 'id'>>,
) => {
  await db()
    .update(CardTemplateTable)
    .set(values)
    .where(eq(CardTemplateTable.id, id));
};

/**
 * Retrieve all card templates.
 *
 * @returns a list of all card templates
 */
export const getAllCardTemplates = (): Promise<CardTemplate[]> =>
  db().select().from(CardTemplateTable);

/**
 * Retrieves a list of card templates for a given web card kind.
 *
 * @param webCardKind - The kind of web card to retrieve the templates for
 * @param cardTemplateTypeId - the card template type id to filter by
 * @param randomSeed - the random seed to use for random ordering of the templates
 * @param offset - the offset to use for pagination
 * @param limit - the limit to use for pagination
 *
 * @return a list of card templates with a cursor for pagination
 */
export const getCardTemplatesForWebCardKind = async (
  webCardKind: 'business' | 'personal',
  cardTemplateTypeId: string | null | undefined,
  randomSeed: string,
  offset?: string | null,
  limit?: number | null,
): Promise<Array<CardTemplate & { cursor: string }>> => {
  const query = sql`
    SELECT *, RAND(${randomSeed}) as cursor
    FROM CardTemplate
    WHERE ${
      webCardKind === 'business'
        ? CardTemplateTable.businessEnabled
        : CardTemplateTable.personalEnabled
    } = 1
   `;
  if (cardTemplateTypeId) {
    query.append(sql` AND cardTemplateTypeId = ${cardTemplateTypeId} `);
  }
  if (offset) {
    query.append(sql` HAVING cursor > ${offset} `);
  }
  query.append(sql` ORDER BY cursor `);
  if (limit) {
    query.append(sql` LIMIT ${limit} `);
  }

  return (await db().execute(query)).rows as Array<
    CardTemplate & { cursor: string }
  >;
};
