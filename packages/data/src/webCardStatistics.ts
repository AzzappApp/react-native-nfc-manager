import { and, eq, inArray, sql } from 'drizzle-orm';
import { primaryKey, int, mysqlTable, date } from 'drizzle-orm/mysql-core';

import db, { cols } from './db';
import { WebCardTable } from './webCards';
import type { DbTransaction } from './db';
import type { InferSelectModel } from 'drizzle-orm';

export const WebCardStatisticTable = mysqlTable(
  'WebCardStatistic',
  {
    webCardId: cols.cuid('webCardId').notNull(),
    day: date('day').notNull(),
    webCardViews: int('webCardViews').default(0).notNull(),
    likes: int('likes').default(0).notNull(),
  },
  table => {
    return {
      id: primaryKey({ columns: [table.webCardId, table.day] }),
    };
  },
);

export type WebCardStatistic = InferSelectModel<typeof WebCardStatisticTable>;

export const getStatisticForWebCard = async (
  webCardId: string,
  day: Date,
  trx: DbTransaction = db,
) =>
  trx
    .select()
    .from(WebCardStatisticTable)
    .where(
      and(
        eq(WebCardStatisticTable.webCardId, webCardId),
        eq(WebCardStatisticTable.day, day),
      ),
    );

/**
 * The function `updateStatistics` updates a specific field in the statistics table for a given profile
 * ID, incrementing the value by 1 if `increase` is true.
 * @param {string} webCardId - A string representing the webcard ID for whom the statistics
 * are being updated.
 * @param {'likes' | 'webCardViews'} field - The `field` parameter is a string
 * that specifies which field in the statistics table should be updated. It can have one of three
 * values: 'contactcardScans', 'likes', or 'webCardViews'.
 * @param increase - The `increase` parameter is a boolean value that determines whether the statistics
 * should be increased or decreased. If `increase` is `true`, the statistics will be increased by 1. If
 * `increase` is `false`, the statistics will be decreased by 1.
 * @param {DbTransaction} trx - The `trx` parameter is an optional parameter of type `DbTransaction`.
 * It represents a database transaction object that is used to perform the database operations in a
 * transactional manner. If a `trx` object is provided, the database operations will be performed
 * within that transaction. If no `trx` object
 * @returns The function `updateStatistics` returns a promise that resolves to the result of the
 * database operation.
 */
export const updateStatistics = async (
  webCardId: string,
  field: 'likes' | 'webCardViews',
  increase: boolean,
  trx: DbTransaction = db,
) => {
  const onDuplicateSet =
    field === 'webCardViews'
      ? {
          set: {
            webCardViews: increase
              ? sql`${WebCardStatisticTable.webCardViews} + 1`
              : sql`${WebCardStatisticTable.webCardViews} - 1`,
          },
        }
      : {
          set: {
            likes: increase
              ? sql`${WebCardStatisticTable.likes} + 1`
              : sql`${WebCardStatisticTable.likes} - 1`,
          },
        };
  return trx
    .insert(WebCardStatisticTable)
    .values({
      webCardId,
      day: new Date(),
      [field]: 1,
    })
    .onDuplicateKeyUpdate(onDuplicateSet);
};

export const incrementWebCardViews = async (webCardId: string) =>
  db.transaction(async trx => {
    await updateStatistics(webCardId, 'webCardViews', true, trx);
    await trx
      .update(WebCardTable)
      .set({
        nbWebCardViews: sql`${WebCardTable.nbWebCardViews} + 1`,
      })
      .where(eq(WebCardTable.id, webCardId));
  });

export const getLastWebCardListStatisticsFor = (
  webCardIds: string[],
  days: number,
) => {
  return db
    .select()
    .from(WebCardStatisticTable)
    .where(
      and(
        inArray(WebCardStatisticTable.webCardId, webCardIds),
        sql`${WebCardStatisticTable.day} > DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`,
      ),
    );
};
