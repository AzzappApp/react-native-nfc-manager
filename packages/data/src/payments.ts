import { eq, desc, count } from 'drizzle-orm';
import { mysqlEnum, int, mysqlTable } from 'drizzle-orm/mysql-core';
import db, { DEFAULT_DATETIME_VALUE, cols } from '#db';
import { createId } from '#/helpers/createId';
import type { DbTransaction } from '#db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const PaymentTable = mysqlTable(
  'Payment',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    amount: int('amount').notNull(),
    taxes: int('taxes').notNull(),
    currency: cols.defaultVarchar('currency').notNull().default('EUR'),
    status: mysqlEnum('status', ['paid', 'failed']).notNull(),
    paymentMeanId: cols.defaultVarchar('paymentMeanId').notNull(),
    rebillManagerId: cols.defaultVarchar('rebillManagerId'),
    transactionId: cols.defaultVarchar('transactionId'),
    paymentProviderResponse: cols.text('paymentProviderResponse'),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    updatedAt: cols
      .dateTime('updatedAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    invoiceId: cols.defaultVarchar('invoiceId'),
    invoicePdfUrl: cols.defaultVarchar('invoiceUrl'),
    subscriptionId: cols.cuid('subscriptionId').notNull(),
    webCardId: cols.cuid('webCardId').notNull(),
  },
  table => {
    return {
      subscriptionIdIdx: cols
        .index('subscriptionId_idx')
        .on(table.subscriptionId),
      webCardIdIdx: cols.index('webCardId_idx').on(table.webCardId),
    };
  },
);

export type NewPayment = InferInsertModel<typeof PaymentTable>;
export type Payment = InferSelectModel<typeof PaymentTable>;

export const createPayment = async (
  payment: NewPayment,
  tx: DbTransaction = db,
) => {
  const id = createId();

  await tx
    .insert(PaymentTable)
    .values({
      ...payment,
      id,
    })
    .execute();

  return id;
};

export const getPaymentById = async (id: string) => {
  return db
    .select()
    .from(PaymentTable)
    .where(eq(PaymentTable.id, id))
    .limit(1)
    .execute()
    .then(result => result[0]);
};

/**
 * Retrieve a webCard's post, ordered by date, with pagination.
 *
 * @param webCardId  The id of the webCard
 * @param limit The maximum number of post to retrieve
 * @param offset The offset of the first post to retrieve
 * @returns A list of post
 */
export const getWebCardPayments = async (
  webCardId: string,
  limit?: number,
  offset?: number,
) => {
  const query = db
    .select()
    .from(PaymentTable)
    .where(eq(PaymentTable.webCardId, webCardId))
    .orderBy(desc(PaymentTable.createdAt));

  if (limit) {
    return query.limit(limit).offset(offset ?? 0);
  }

  return query;
};

export const countWebCardPayments = async (webCardId: string) => {
  return db
    .select({ count: count() })
    .from(PaymentTable)
    .where(eq(PaymentTable.webCardId, webCardId))
    .then(result => result[0].count);
};
