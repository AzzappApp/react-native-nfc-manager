import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, transaction } from '../database';
import { WebCardStatisticTable, WebCardTable } from '../schema';
import type { WebCardStatistic } from '../schema';

/**
 * Retrieve the statistics for a web card for a specific day
 *
 * @param webCardId - the id of the web card
 * @param day - the day for which the statistics should be retrieved
 * @returns The statistics if found, otherwise null
 */
export const getStatisticForWebCard = async (
  webCardId: string,
  day: Date,
): Promise<WebCardStatistic | null> =>
  db()
    .select()
    .from(WebCardStatisticTable)
    .where(
      and(
        eq(WebCardStatisticTable.webCardId, webCardId),
        eq(WebCardStatisticTable.day, day),
      ),
    )
    .then(res => res[0] ?? null);

/**
 * The function `updateStatistics` updates a specific field in the statistics table for a given profile
 * ID, incrementing the value by 1 if `increase` is true.
 *
 * @param webCardId - the id of the web card for which the statistics are being updated.
 * @param field - the statistics field that should be updated.
 * @param increase - The `increase` parameter is a boolean value that determines whether the statistics
 * should be increased or decreased. If `increase` is `true`, the statistics will be increased by 1. If
 * `increase` is `false`, the statistics will be decreased by 1.

 */
export const updateStatistics = async (
  webCardId: string,
  field: 'likes' | 'webCardViews',
  increase: boolean,
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
  await db()
    .insert(WebCardStatisticTable)
    .values({
      webCardId,
      day: new Date(),
      [field]: 1,
    })
    .onDuplicateKeyUpdate(onDuplicateSet);
};

/**
 * Increments the number of views for a web card
 *
 * @param webCardId - the id of the web card for which the views are being incremented
 */
export const incrementWebCardViews = async (webCardId: string) =>
  transaction(async () => {
    await updateStatistics(webCardId, 'webCardViews', true);
    await db()
      .update(WebCardTable)
      .set({
        nbWebCardViews: sql`${WebCardTable.nbWebCardViews} + 1`,
      })
      .where(eq(WebCardTable.id, webCardId));
  });

/**
 * Retrieves the last `days` of statistics for a list of web cards.
 *
 * @param webCardIds - The list of web card IDs for which the statistics are being retrieved.
 * @param days - The number of days for which the statistics are being retrieved.
 * @returns A record of web card IDs and their corresponding statistics.
 */
export const getLastWebCardListStatisticsFor = async (
  webCardIds: string[],
  days: number,
) => {
  const webCardsStatistics = await db()
    .select()
    .from(WebCardStatisticTable)
    .where(
      and(
        inArray(WebCardStatisticTable.webCardId, webCardIds),
        sql`${WebCardStatisticTable.day} > DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`,
      ),
    );

  return webCardsStatistics.reduce(
    (acc, stat) => {
      if (!acc[stat.webCardId]) {
        acc[stat.webCardId] = [];
      }

      acc[stat.webCardId].push(stat);

      return acc;
    },
    {} as Record<string, WebCardStatistic[]>,
  );
};
