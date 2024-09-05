import { and, asc, count, desc, eq, isNull, max, sql } from 'drizzle-orm';
import { db } from '../database';
import { ReportTable } from '../schema';
import type { Report, ReportTargetType } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

export type NewReport = InferInsertModel<typeof ReportTable>;
/**
 * Create a report
 *
 * @param newReport - The report to create
 */
export const createReport = async (newReport: NewReport) => {
  await db().insert(ReportTable).values(newReport);
};

/**
 * update a report
 *
 * @param userId - The id of the user who created the report
 * @param targetId - The id of the target
 * @param targetType - The type of the target
 * @param updates - The updates to apply to the report
 */
export const updateReport = async (
  userId: string,
  targetId: string,
  targetType: ReportTargetType,
  updates: Partial<Omit<Report, 'targetId' | 'targetType' | 'userId'>>,
) => {
  await db()
    .update(ReportTable)
    .set(updates)
    .where(
      and(
        eq(ReportTable.userId, userId),
        eq(ReportTable.targetId, targetId),
        eq(ReportTable.targetType, targetType),
      ),
    );
};

/**
 * Mark reports for a target as treated
 *
 * @param targetId - The id of the target
 * @param targetType - The type of the target
 * @param treatedBy - The id of the user who treated the reports
 */
export const markReportsAsTreated = async (
  targetId: string,
  targetType: ReportTargetType,
  treatedBy: string,
) => {
  await db()
    .update(ReportTable)
    .set({ treatedBy, treatedAt: new Date() })
    .where(
      and(
        eq(ReportTable.targetId, targetId),
        eq(ReportTable.targetType, targetType),
        isNull(ReportTable.treatedBy),
      ),
    );
};

/**
 * Get a report by targetId, userId and targetType
 *
 * @param targetId - The id of the target
 * @param userId - The id of the user
 * @param targetType - The type of the target
 * @returns The report if it exists
 */
export const getReport = async (
  targetId: string,
  userId: string,
  targetType: 'comment' | 'post' | 'webCard',
): Promise<Report | null> =>
  db()
    .select()
    .from(ReportTable)
    .where(
      and(
        eq(ReportTable.targetId, targetId),
        eq(ReportTable.userId, userId),
        eq(ReportTable.targetType, targetType),
      ),
    )
    .then(rows => rows[0] ?? null);

export const getActiveReports = async () =>
  db()
    .select({
      status:
        sql`(ISNULL(MAX(${ReportTable.treatedAt})) OR MAX(${ReportTable.treatedAt}) < MAX(${ReportTable.createdAt}))`
          .mapWith(Number)
          .as('status'),
    })
    .from(ReportTable)
    .groupBy(ReportTable.targetId, ReportTable.targetType);

/**
 * Get the reports for a target
 *
 * @param targetId - The id of the target
 * @param targetType - The type of the target
 * @param offset - The offset to start the query
 * @param limit - The limit of the query
 *
 * @returns The reports for the target
 */
export const getTargetReports = async (
  targetId: string,
  targetType: ReportTargetType,
  offset: number,
  limit: number,
): Promise<{ reports: Report[]; count: number }> => {
  const reports = db()
    .select()
    .from(ReportTable)
    .where(
      and(
        eq(ReportTable.targetId, targetId),
        eq(ReportTable.targetType, targetType),
      ),
    )
    .orderBy(desc(ReportTable.createdAt))
    .offset(offset)
    .limit(limit);

  const nbReports = db()
    .select({ count: count() })
    .from(ReportTable)
    .where(
      and(
        eq(ReportTable.targetId, targetId),
        eq(ReportTable.targetType, targetType),
      ),
    )
    .then(rows => rows[0].count);

  return { reports: await reports, count: await nbReports };
};

/**
 * Return the reports information grouped by targetId and targetType
 *
 * @param args - The arguments to filter the reports
 * @param args.offset - The offset to start the query
 * @param args.limit - The limit of the query
 * @param args.status - The status of the reports to filter by
 * @param args.targetType - The type of the target to filter by
 * @param args.sort - The sort field and order
 * @param args.sort.sortField - The field to sort by
 * @param args.sort.sortOrder - The order to sort by
 *
 * @returns The reports and the number of reports matching the filter criteria
 */
export const getReportsByTarget = async ({
  offset,
  limit,
  status = 'all',
  targetType = 'all',
  sort = { sortField: 'latestReport', sortOrder: 'desc' },
}: {
  offset: number;
  limit: number;
  status?: 'all' | 'closed' | 'open';
  targetType?: 'all' | 'comment' | 'post' | 'webCard';
  sort?: {
    sortField:
      | 'latestReport'
      | 'reportCount'
      | 'status'
      | 'targetId'
      | 'targetType'
      | 'treatedAt';
    sortOrder: 'asc' | 'desc';
  };
}) => {
  const sortFunc = sort.sortOrder === 'asc' ? asc : desc;

  let query = db()
    .select({
      targetId: ReportTable.targetId,
      targetType: ReportTable.targetType,
      reportCount: count().as('reportCount'),
      latestReport: max(ReportTable.createdAt).as('latestReport'),
      treatedAt: max(ReportTable.treatedAt).as('treatedAt'),
      status:
        sql`(ISNULL(MAX(${ReportTable.treatedAt})) OR MAX(${ReportTable.treatedAt}) < MAX(${ReportTable.createdAt}))`
          .mapWith(Number)
          .as('status'),
    })
    .from(ReportTable)
    .orderBy(sortFunc(sql.raw(sort.sortField)))
    .groupBy(ReportTable.targetId, ReportTable.targetType)
    .$dynamic();

  if (status !== 'all') {
    query = query.having(eq(sql`status`, status === 'open' ? 1 : 0));
  }
  if (targetType !== 'all') {
    query = query.where(eq(sql`targetType`, targetType));
  }

  const countQuery = db().select({ count: count() }).from(query.as('Report'));

  const [reports, nbReports] = await Promise.all([
    query.offset(offset).limit(limit),
    countQuery.then(rows => rows[0].count),
  ]);

  return { reports, count: nbReports };
};
