import { and, asc, eq, type InferInsertModel } from 'drizzle-orm';
import { db } from '../database';
import { PaymentMeanTable } from '../schema';
import type { PaymentMean } from '../schema';

/**
 * Create a payment mean.
 *
 * @param newPaymentMean - the payment mean to create
 * @returns The id of the created payment mean
 */
export const createPaymentMean = async (
  newPaymentMean: InferInsertModel<typeof PaymentMeanTable>,
) =>
  db()
    .insert(PaymentMeanTable)
    .values(newPaymentMean)
    .then(() => newPaymentMean.id);

export const getPaymentMeanById = async (
  id: string,
): Promise<PaymentMean | null> =>
  db()
    .select()
    .from(PaymentMeanTable)
    .where(eq(PaymentMeanTable.id, id))
    .then(result => result[0]);

/**
 * Retrieve a list payment means by user id and web card id.
 *
 * @param userId - The id of the user
 *
 * @returns a list of payment means
 */
export const getActivePaymentMeans = async (
  userId: string,
): Promise<PaymentMean[]> =>
  db()
    .select()
    .from(PaymentMeanTable)
    .where(
      and(
        eq(PaymentMeanTable.userId, userId),
        eq(PaymentMeanTable.status, 'active'),
      ),
    )
    .orderBy(asc(PaymentMeanTable.createdAt));

/**
 * Update a payment mean.
 *
 * @param paymentMeanId - The id of the payment mean to update
 * @param updates - The updates to apply to the payment mean
 */
export const updatePaymentMean = async (
  paymentMeanId: string,
  updates: Partial<Omit<PaymentMean, 'id'>>,
) => {
  await db()
    .update(PaymentMeanTable)
    .set(updates)
    .where(eq(PaymentMeanTable.id, paymentMeanId));
};
