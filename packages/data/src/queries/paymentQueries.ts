import { eq, desc, count, and } from 'drizzle-orm';
import { db } from '../database';
import { PaymentTable } from '../schema';
import type { Payment } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Create a payment.
 *
 * @param newPayment - the payment fields
 * @returns the newly created payment id
 */
export const createPayment = async (
  newPayment: InferInsertModel<typeof PaymentTable>,
) =>
  db()
    .insert(PaymentTable)
    .values(newPayment)
    .$returningId()
    .then(res => res[0]?.id);

/**
 * Retrieve a payment by its id.
 * @param id - The id of the payment to retrieve
 * @returns the payment, or null if no payment was found
 */
export const getPaymentById = (id: string): Promise<Payment | null> =>
  db()
    .select()
    .from(PaymentTable)
    .where(eq(PaymentTable.id, id))
    .then(result => result[0]);

/**
 * Retrieve user payments, paginated.
 *
 * @param userId  The id of the user to retrieve the payments from
 * @param limit The maximum number of payments to retrieve
 * @param offset The number of payments to skip
 * @returns the list of user payments
 */
export const getUserPayments = async (
  userId: string,
  limit?: number,
  offset?: number,
): Promise<Payment[]> => {
  let query = db()
    .select()
    .from(PaymentTable)
    .where(eq(PaymentTable.userId, userId))
    .orderBy(desc(PaymentTable.createdAt))
    .$dynamic();

  if (limit) {
    query = query.limit(limit).offset(offset ?? 0);
  }
  return query;
};

export const getPaymentByTransactionId = async (
  subscriptionId: string,
  transactionId: string,
): Promise<Payment[]> =>
  db()
    .select()
    .from(PaymentTable)
    .where(
      and(
        eq(PaymentTable.subscriptionId, subscriptionId),
        eq(PaymentTable.transactionId, transactionId),
      ),
    );

/**
 * Count the number of payments for a user.
 *
 * @param userId - The id of the user
 * @returns the number of payments for the user
 */
export const countUserPayments = async (userId: string): Promise<number> =>
  db()
    .select({ count: count() })
    .from(PaymentTable)
    .where(eq(PaymentTable.userId, userId))
    .then(result => result[0].count);

/**
 * Update a payment.
 * @param id - The id of the payment to update
 * @param updates - The updates to apply to the payment
 */
export const updatePayment = async (
  id: string,
  updates: Partial<Omit<Payment, 'id'>>,
) => {
  await db().update(PaymentTable).set(updates).where(eq(PaymentTable.id, id));
};
