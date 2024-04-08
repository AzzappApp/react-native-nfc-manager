import { and, eq } from 'drizzle-orm';
import db, { DEFAULT_DATETIME_VALUE, cols } from './db';
import type { DbTransaction } from './db';
import type { InferSelectModel } from 'drizzle-orm';

export const ReportTable = cols.table(
  'Report',
  {
    targetId: cols.defaultVarchar('targetId').notNull(),
    userId: cols.defaultVarchar('userId').notNull(),
    targetType: cols
      .enum('targetType', ['webCard', 'post', 'comment'])
      .notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    treatedBy: cols.defaultVarchar('treatedBy'),
    treatedAt: cols.dateTime('treatedAt'),
  },
  table => {
    return {
      id: cols.primaryKey({
        columns: [table.targetId, table.userId, table.targetType],
      }),
      targetTypeKey: cols
        .index('Report_targetType_key')
        .on(table.targetType, table.createdAt, table.treatedBy),
    };
  },
);

export type Report = InferSelectModel<typeof ReportTable>;

export type TargetType = Report['targetType'];

export const createReport = async (
  targetId: string,
  userId: string,
  targetType: 'comment' | 'post' | 'webCard',
  tx: DbTransaction = db,
) => {
  await tx.insert(ReportTable).values({
    targetId,
    userId,
    targetType,
  });
};

export const getReport = async (
  targetId: string,
  userId: string,
  targetType: 'comment' | 'post' | 'webCard',
  tx: DbTransaction = db,
) => {
  return tx
    .select()
    .from(ReportTable)
    .where(
      and(
        eq(ReportTable.targetId, targetId),
        eq(ReportTable.userId, userId),
        eq(ReportTable.targetType, targetType),
      ),
    )
    .then(rows => rows.pop());
};
