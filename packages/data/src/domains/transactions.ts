import { createId } from '@paralleldrive/cuid2';
import { index, mysqlTable, json } from 'drizzle-orm/mysql-core';
import { cols } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const TransactionTable = mysqlTable(
  'Transaction',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userId: cols.cuid('userId').notNull(),
    receipt: json('receipt').$type<any>().notNull(), //TODO type to defined
    createdAt: cols.dateTime('createdAt').notNull(),
  },
  table => {
    return {
      userIdIdx: index('Transaction_userId_idx').on(table.userId),
    };
  },
);

export type Transaction = InferSelectModel<typeof TransactionTable>;
export type NewTransaction = InferInsertModel<typeof TransactionTable>;
