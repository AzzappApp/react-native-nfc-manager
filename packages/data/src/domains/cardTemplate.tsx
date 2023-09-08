import { createId } from '@paralleldrive/cuid2';
import { type InferModel, eq, sql } from 'drizzle-orm';
import {
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
  json,
  boolean,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { CardModule } from './cardModules';
import type { DbTransaction } from './db';

export type CardModuleTemplate = Pick<CardModule, 'data' | 'kind'>;

export const CardTemplateTable = mysqlTable('CardTemplate', {
  id: cols.cuid('id').notNull().primaryKey(),
  labels: cols.labels('labels').notNull(),
  cardStyleId: cols.cuid('cardStyleId').notNull(),
  previewMediaId: cols.mediaId('previewMediaId'),
  modules: json('modules').$type<CardModuleTemplate[]>().notNull(),
  businessEnabled: boolean('businessEnabled').default(true).notNull(),
  personalEnabled: boolean('personalEnabled').default(true).notNull(),
});

export const CardTemplateCompanyActivityTable = mysqlTable(
  'CardTemplateCompanyActivity',
  {
    cardTemplateId: cols.cuid('cardTemplateId').notNull(),
    companyActivityId: cols.cuid('companyActivityId').notNull(),
  },
  table => {
    return {
      pk: primaryKey(table.cardTemplateId, table.companyActivityId),
    };
  },
);

export const CardTemplateProfileCategoryTable = mysqlTable(
  'CardTemplateProfileCategory',
  {
    cardTemplateId: cols.cuid('cardTemplateId').notNull(),
    profileCategoryId: cols.cuid('profileCategoryId').notNull(),
  },
  table => {
    return {
      pk: primaryKey(table.cardTemplateId, table.profileCategoryId),
    };
  },
);

export type CardTemplate = InferModel<typeof CardTemplateTable>;
export type NewCardTemplate = InferModel<typeof CardTemplateTable, 'insert'>;

/**
 * Retrieve a cardTemplate by its id.
 * @param id - The id of the cardTemplate to retrieve
 * @returns the cardTemplate, or null if no cardTemplate was found
 */
export const getCardTemplateById = (id: string) =>
  db
    .select()
    .from(CardTemplateTable)
    .where(eq(CardTemplateTable.id, id))
    .then(rows => rows[0] ?? null);

/**
 * Create a cardTemplate.
 *
 * @param newCardTemplate - the cardTemplate fields, excluding the id
 * @param tx - The query creator to use (user for transactions)
 * @returns The created cardTemplate
 */
export const createCardTemplate = async (
  newCardTemplate: Omit<NewCardTemplate, 'id'>,
  tx: DbTransaction = db,
) => {
  const id = createId();
  await tx.insert(CardTemplateTable).values({ ...newCardTemplate, id });
  return { ...newCardTemplate, id };
};

/**
 * Update a card template.
 *
 * @param id - The id of the card template to update
 * @param values - the card template fields, excluding the id and the cardDate
 * @param tx - The query creator to use (profile for transactions)
 */
export const updateCardTemplate = async (
  id: string,
  values: Partial<CardTemplate>,
  tx: DbTransaction = db,
) => {
  await tx
    .update(CardTemplateTable)
    .set({ ...values })
    .where(eq(CardTemplateTable.id, id));
};

/**
 * Return a list of card template
 */
export const getCardTemplates = async (
  randomSeed: string,
  offset?: string | null,
  limit?: number | null,
) => {
  const query = sql`
    SELECT *, RAND(${randomSeed}) as cursor
    FROM CardTemplate
   `;
  if (offset) {
    query.append(sql` HAVING cursor > ${offset} `);
  }
  query.append(sql` ORDER BY cursor `);
  if (limit) {
    query.append(sql` LIMIT ${limit} `);
  }

  return (await db.execute(query)).rows as Array<
    CardTemplate & { cursor: string }
  >;
};
