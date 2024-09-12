import { and, inArray, sql } from 'drizzle-orm';
import { db } from '../database';
import { ProfileStatisticTable } from '../schema';
import type { ProfileStatistic } from '../schema';

/**
 * The function `incrementContactCardScans` updates `contactCardScans` in the statistics table for a given profile
 * ID, incrementing the value by 1 if `increase` is true.
 *
 * @param profileId - The id of profile for whom the statistics are being updated.
 * @param increase - The `increase` parameter is a boolean value that determines whether the statistics
 * should be increased or decreased. If `increase` is `true`, the statistics will be increased by 1. If
 * `increase` is `false`, the statistics will be decreased by 1.
 */
export const incrementContactCardScans = async (
  profileId: string,
  increase: boolean,
) => {
  const onDuplicateSet = {
    set: {
      contactCardScans: increase
        ? sql`${ProfileStatisticTable.contactCardScans} + 1`
        : sql`${ProfileStatisticTable.contactCardScans} - 1`,
    },
  };

  await db()
    .insert(ProfileStatisticTable)
    .values({
      profileId,
      day: new Date(),
      contactCardScans: 1,
    })
    .onDuplicateKeyUpdate(onDuplicateSet);
};

/**
 * Retrieve the last `days` of statistics for a list of profiles.
 *
 * @param profileIds - The list of profile IDs for which the statistics are being retrieved.
 * @param days - The number of days for which the statistics are being retrieved.
 * @returns A record of profile IDs and their corresponding statistics.
 */
export const getLastProfileListStatisticsFor = async (
  profileIds: string[],
  days: number,
): Promise<Record<string, ProfileStatistic[]>> => {
  const profileStatistics = await db()
    .select()
    .from(ProfileStatisticTable)
    .where(
      and(
        inArray(ProfileStatisticTable.profileId, profileIds),
        sql`${ProfileStatisticTable.day} >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`,
      ),
    );

  return profileStatistics.reduce(
    (acc, stat) => {
      if (!acc[stat.profileId]) {
        acc[stat.profileId] = [];
      }

      acc[stat.profileId].push(stat);

      return acc;
    },
    {} as Record<string, ProfileStatistic[]>,
  );
};
