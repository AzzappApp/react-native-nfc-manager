import { and, asc, eq, type InferInsertModel } from 'drizzle-orm';
import { mysqlEnum, mysqlTable } from 'drizzle-orm/mysql-core';
import db, { DEFAULT_DATETIME_VALUE, cols } from '#db';
import type { DbTransaction } from '#db';

export const PaymentMeanTable = mysqlTable(
  'PaymentMean',
  {
    id: cols.defaultVarchar('id').primaryKey().notNull(), //stored with payment
    userId: cols.cuid('userId').notNull(),
    webCardId: cols.defaultVarchar('webCardId').notNull(),
    maskedCard: cols.defaultVarchar('maskedCard').notNull(),
    status: mysqlEnum('status', ['pending', 'active', 'inactive'])
      .notNull()
      .default('pending'),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
  },
  table => {
    return {
      indexes: {
        userId: cols
          .index('PaymentMean_userId_webCardId_idx')
          .on(table.userId, table.webCardId),
      },
    };
  },
);

export type PaymentMean = InferInsertModel<typeof PaymentMeanTable>;
export type NewPaymentMean = InferInsertModel<typeof PaymentMeanTable>;

export const createPaymentMean = async (
  paymentMean: NewPaymentMean,
  tx: DbTransaction = db,
) => {
  await tx.insert(PaymentMeanTable).values(paymentMean).execute();

  return paymentMean.id;
};

export const getActivePaymentMeans = async (
  userId: string,
  webCardId: string,
) => {
  return db
    .select()
    .from(PaymentMeanTable)
    .where(
      and(
        eq(PaymentMeanTable.userId, userId),
        eq(PaymentMeanTable.webCardId, webCardId),
        eq(PaymentMeanTable.status, 'active'),
      ),
    )
    .orderBy(asc(PaymentMeanTable.createdAt))
    .execute();
};
