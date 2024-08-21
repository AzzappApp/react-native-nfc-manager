import { sql, eq, and, like, count, asc, desc } from 'drizzle-orm';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import { db } from '../database';
import {
  CardStyleTable,
  LocalizationMessageTable,
  type CardStyle,
} from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Retrieve a card style by its id.
 * @param id - The id of the CardStyle to retrieve
 * @returns the CardStyle, or null if no CardStyle was found
 */
export const getCardStyleById = (id: string): Promise<CardStyle | null> =>
  db()
    .select()
    .from(CardStyleTable)
    .where(eq(CardStyleTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Create a card style.
 *
 * @param cardStyle - the CardStyle fields
 * @returns The created cardStyle
 */
export const createCardStyle = async (
  newCardStyle: InferInsertModel<typeof CardStyleTable>,
) =>
  db()
    .insert(CardStyleTable)
    .values(newCardStyle)
    .$returningId()
    .then(res => res[0].id);

/**
 * Update a card style.
 *
 * @param id - The id of the card style to update
 * @param values - the card style fields and the cardDate
 */
export const updateCardStyle = async (
  id: string,
  values: Partial<Omit<CardStyle, 'id'>>,
) => {
  await db()
    .update(CardStyleTable)
    .set(values)
    .where(eq(CardStyleTable.id, id));
};

/**
 * Retrieve a list of card styles and their labels with pagination.
 *
 * @param args - The arguments to filter and paginate the card styles
 * @param args.locale - The locale to use for the labels (default: 'en-US')
 * @param args.sortOrder - The sort order to use for the card styles labels (default: 'asc')
 * @param args.search - The search string to filter the card styles by
 * @param args.offset - The offset to use for pagination
 * @param args.limit - The limit to use for pagination
 *
 * @returns
 */
export const getCardStylesWithLabel = async ({
  locale = DEFAULT_LOCALE,
  sortOrder = 'asc',
  search,
  offset,
  limit,
}: {
  locale?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string | null;
  offset: number;
  limit: number;
}): Promise<{
  count: number;
  cardStyles: Array<{
    cardStyle: CardStyle;
    label: string | null;
  }>;
}> => {
  let query = db()
    .select({
      cardStyle: CardStyleTable,
      label: LocalizationMessageTable.value,
    })
    .from(CardStyleTable)
    .leftJoin(
      LocalizationMessageTable,
      and(
        eq(CardStyleTable.id, LocalizationMessageTable.key),
        eq(LocalizationMessageTable.target, ENTITY_TARGET),
        eq(LocalizationMessageTable.locale, locale),
      ),
    )
    .$dynamic();

  let countQuery = db()
    .select({
      count: count(),
    })
    .from(CardStyleTable)
    .leftJoin(
      LocalizationMessageTable,
      and(
        eq(CardStyleTable.id, LocalizationMessageTable.key),
        eq(LocalizationMessageTable.target, ENTITY_TARGET),
        eq(LocalizationMessageTable.locale, locale),
      ),
    )
    .$dynamic();

  if (search) {
    query = query.where(like(LocalizationMessageTable.value, `%${search}%`));
    countQuery = countQuery.where(
      like(LocalizationMessageTable.value, `%${search}%`),
    );
  }

  const [countResult, queryResult] = await Promise.all([
    countQuery,
    query
      .orderBy(
        sortOrder === 'asc'
          ? asc(LocalizationMessageTable.value)
          : desc(LocalizationMessageTable.value),
      )
      .offset(offset)
      .limit(limit),
  ]);

  return {
    count: countResult[0].count,
    cardStyles: queryResult,
  };
};

/**
 * Retrieve a list of all card styles.
 *
 * @returns a list of all card styles
 */
export const getAllCardStyles = async (): Promise<CardStyle[]> =>
  db().select().from(CardStyleTable);

/**
 * Return a list of card styles with pagination sorted randomly.
 *
 * @param randomSeed the random seed to use for random ordering
 * @param offset the offset to use for pagination
 * @param limit the limit to use for pagination
 * @return a list of card styles with a cursor for pagination
 */
export const getCardStylesRandomOrder = async (
  randomSeed: string,
  offset?: string | null,
  limit?: number | null,
): Promise<Array<CardStyle & { cursor: string }>> => {
  const query = sql`
    SELECT *, RAND(${randomSeed}) as cursor
    FROM CardStyle`;
  if (offset) {
    query.append(sql` HAVING cursor > ${offset} `);
  }
  query.append(sql` ORDER BY cursor `);
  if (limit) {
    query.append(sql` LIMIT ${limit} `);
  }

  return (await db().execute(query)).rows as Array<
    CardStyle & { cursor: string }
  >;
};
