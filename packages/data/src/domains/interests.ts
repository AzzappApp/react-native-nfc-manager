import { eq } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { DEFAULT_VARCHAR_LENGTH } from './db';
import { customLabels } from './generic';
import type { InferModel } from 'drizzle-orm';

export const InterestTable = mysqlTable('Interest', {
  tag: varchar('tag', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
  labels: customLabels('labels'),
  id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH }).primaryKey().notNull(),
});

export type Interest = InferModel<typeof InterestTable>;
export type NewInterest = InferModel<typeof InterestTable, 'insert'>;

/**
 * Retrieves a list of all interest
 * @returns A list of interest
 */
export const getInterests = async () => db.select().from(InterestTable);

/**
 * Retrieves a interest by its id
 * @param id - The id of the interest to retrieve
 * @returns
 */
export const getInterestById = async (tag: string) => {
  return db
    .select()
    .from(InterestTable)
    .where(eq(InterestTable.tag, tag))

    .then(res => res.pop() ?? null);
};
