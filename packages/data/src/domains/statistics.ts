import { and, eq, sql } from 'drizzle-orm';
import { primaryKey, int, mysqlTable, date } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferSelectModel } from 'drizzle-orm';

export const StatisticTable = mysqlTable(
  'Statistic',
  {
    profileId: cols.cuid('profileId').notNull(),
    day: date('day').notNull(),
    webcardViews: int('webcardViews').default(0).notNull(),
    contactcardScans: int('contactcardScans').default(0).notNull(),
    likes: int('likes').default(0).notNull(),
  },
  table => {
    return {
      id: primaryKey(table.profileId, table.day),
    };
  },
);

export type Statistic = InferSelectModel<typeof StatisticTable>;

export const getStatisticForProfile = async (
  profileId: string,
  day: Date,
  trx: DbTransaction = db,
) =>
  trx
    .select()
    .from(StatisticTable)
    .where(
      and(eq(StatisticTable.profileId, profileId), eq(StatisticTable.day, day)),
    );

/**
 * The function `updateStatistics` updates a specific field in the statistics table for a given profile
 * ID, incrementing the value by 1 if `increase` is true.
 * @param {string} profileId - A string representing the profile ID of the user for whom the statistics
 * are being updated.
 * @param {'contactcardScans' | 'likes' | 'webcardViews'} field - The `field` parameter is a string
 * that specifies which field in the statistics table should be updated. It can have one of three
 * values: 'contactcardScans', 'likes', or 'webcardViews'.
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
  profileId: string,
  field: 'contactcardScans' | 'likes' | 'webcardViews',
  increase: boolean,
  trx: DbTransaction = db,
) => {
  const onDuplicateSet =
    field === 'contactcardScans'
      ? {
          set: {
            contactcardScans: increase
              ? sql`${StatisticTable.contactcardScans} + 1`
              : sql`${StatisticTable.contactcardScans} - 1`,
          },
        }
      : field === 'webcardViews'
      ? {
          set: {
            webcardViews: increase
              ? sql`${StatisticTable.webcardViews} + 1`
              : sql`${StatisticTable.webcardViews} - 1`,
          },
        }
      : {
          set: {
            likes: increase
              ? sql`${StatisticTable.likes} + 1`
              : sql`${StatisticTable.likes} - 1`,
          },
        };
  return trx
    .insert(StatisticTable)
    .values({
      profileId,
      day: new Date(),
      [field]: 1,
    })
    .onDuplicateKeyUpdate(onDuplicateSet);
};

export const getLastStatisticsFor = (profileId: string, days: number) => {
  return db
    .select()
    .from(StatisticTable)
    .where(
      and(
        eq(StatisticTable.profileId, profileId),
        sql`${StatisticTable.day} >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`,
      ),
    );
};
