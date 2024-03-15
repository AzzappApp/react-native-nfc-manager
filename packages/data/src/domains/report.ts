import { and, eq } from 'drizzle-orm';
import {
  index,
  mysqlEnum,
  mysqlTable,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';

export const ReportTable = mysqlTable(
  'Report',
  {
    targetId: cols.defaultVarchar('targetId').notNull(),
    userId: cols.defaultVarchar('userId').notNull(),
    targetType: mysqlEnum('targetType', [
      'webCard',
      'post',
      'comment',
    ]).notNull(),
    createdAt: cols.dateTime('createdAt').notNull(),
    treatedBy: cols.defaultVarchar('treatedBy'),
  },
  table => {
    return {
      id: primaryKey({
        columns: [table.targetId, table.userId, table.targetType],
      }),
      targetTypeKey: index('Report_targetType_key').on(
        table.targetType,
        table.createdAt,
        table.treatedBy,
      ),
    };
  },
);

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
