import { sql, eq } from 'drizzle-orm';
import { mysqlTable, boolean, smallint } from 'drizzle-orm/mysql-core';
import { createId } from '#helpers/createId';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const CardStyleTable = mysqlTable('CardStyle', {
  id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
  labels: cols.labels('labels').notNull(),
  fontFamily: cols.defaultVarchar('fontFamily').notNull(),
  fontSize: smallint('fontSize').notNull(),
  titleFontFamily: cols.defaultVarchar('titleFontFamily').notNull(),
  titleFontSize: smallint('titleFontSize').notNull(),
  borderRadius: smallint('borderRadius').notNull(),
  borderWidth: smallint('borderWidth').notNull(),
  borderColor: cols.color('borderColor').notNull(),
  buttonColor: cols.color('buttonColor').notNull(),
  buttonRadius: smallint('buttonRadius').notNull(),
  gap: smallint('gap').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
});

export type CardStyle = InferSelectModel<typeof CardStyleTable>;
export type NewCardStyle = InferInsertModel<typeof CardStyleTable>;

/**
 * Retrieve a cardStyle by its id.
 * @param id - The id of the cardStyle to retrieve
 * @returns the cardStyle, or null if no cardStyle was found
 */
export const getCardStyleById = (id: string) =>
  db
    .select()
    .from(CardStyleTable)
    .where(eq(CardStyleTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Create a cardStyle.
 *
 * @param cardStyle - the cardStyle fields, excluding the id
 * @param tx - The query creator to use (user for transactions)
 * @returns The created cardStyle
 */
export const createCardStyle = async (
  newCardStyle: NewCardStyle,
  tx: DbTransaction = db,
) => {
  const id = createId();
  await tx.insert(CardStyleTable).values({ ...newCardStyle, id });
  return id;
};

/**
 * Update a card style.
 *
 * @param id - The id of the card style to update
 * @param values - the card style fields, excluding the id and the cardDate
 * @param tx - The query creator to use (profile for transactions)
 */
export const updateCardStyle = async (
  id: string,
  values: Partial<CardStyle>,
  tx: DbTransaction = db,
) => {
  await tx
    .update(CardStyleTable)
    .set({ ...values })
    .where(eq(CardStyleTable.id, id));
};

/**
 * Return a list of card styles. filtered by profile kind and template kind
 * @param webCardKind the profile kind to filter by
 * @param templateKind the template kind to filter by
 * @param randomSeed the random seed to use for random ordering
 * @param offset the offset to use for pagination
 * @param limit the limit to use for pagination
 * @return {*}  {Promise<Array<CardStyle & { cursor: string }>>}
 */
export const getCardStyles = async (
  randomSeed: string,
  offset?: string | null,
  limit?: number | null,
) => {
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

  return (await db.execute(query)).rows as Array<
    CardStyle & { cursor: string }
  >;
};
