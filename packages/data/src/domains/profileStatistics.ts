import { and, eq, sql } from 'drizzle-orm';
import { primaryKey, int, mysqlTable, date } from 'drizzle-orm/mysql-core';

import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferSelectModel } from 'drizzle-orm';

export const ProfileStatisticTable = mysqlTable(
  'ProfileStatistic',
  {
    profileId: cols.cuid('profileId').notNull(),
    day: date('day').notNull(),
    contactCardScans: int('contactCardScans').default(0).notNull(),
  },
  table => {
    return {
      id: primaryKey(table.profileId, table.day),
    };
  },
);

export type ProfileStatistic = InferSelectModel<typeof ProfileStatisticTable>;

export const getStatisticForProfile = async (
  profileId: string,
  day: Date,
  trx: DbTransaction = db,
) =>
  trx
    .select()
    .from(ProfileStatisticTable)
    .where(
      and(
        eq(ProfileStatisticTable.profileId, profileId),
        eq(ProfileStatisticTable.day, day),
      ),
    );

/**
 * The function `incrementContactCardScans` updates `contactCardScans` in the statistics table for a given profile
 * ID, incrementing the value by 1 if `increase` is true.
 * @param {string} profileId - A string representing the profile ID of the user for whom the statistics
 * are being updated.
 * @param increase - The `increase` parameter is a boolean value that determines whether the statistics
 * should be increased or decreased. If `increase` is `true`, the statistics will be increased by 1. If
 * `increase` is `false`, the statistics will be decreased by 1.
 * @param {DbTransaction} trx - The `trx` parameter is an optional parameter of type `DbTransaction`.
 * It represents a database transaction object that is used to perform the database operations in a
 * transactional manner. If a `trx` object is provided, the database operations will be performed
 * within that transaction. If no `trx` object
 * @returns The function `incrementContactCardScans` returns a promise that resolves to the result of the
 * database operation.
 */
export const incrementContactCardScans = async (
  profileId: string,
  increase: boolean,
  trx: DbTransaction = db,
) => {
  const onDuplicateSet = {
    set: {
      contactCardScans: increase
        ? sql`${ProfileStatisticTable.contactCardScans} + 1`
        : sql`${ProfileStatisticTable.contactCardScans} - 1`,
    },
  };

  return trx
    .insert(ProfileStatisticTable)
    .values({
      profileId,
      day: new Date(),
      contactCardScans: 1,
    })
    .onDuplicateKeyUpdate(onDuplicateSet);
};

export const getLastProfileStatisticsFor = (
  profileId: string,
  days: number,
) => {
  return db
    .select()
    .from(ProfileStatisticTable)
    .where(
      and(
        eq(ProfileStatisticTable.profileId, profileId),
        sql`${ProfileStatisticTable.day} >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`,
      ),
    );
};
