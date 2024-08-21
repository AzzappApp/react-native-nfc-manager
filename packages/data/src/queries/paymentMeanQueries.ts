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

/**
 * Retrieve a list payment means by user id and web card id.
 *
 * @param userId - The id of the user
 * @param webCardId - The id of the web card
 *
 * @returns a list of payment means
 */
export const getActivePaymentMeans = async (
  userId: string,
  webCardId: string,
): Promise<PaymentMean[]> =>
  db()
    .select()
    .from(PaymentMeanTable)
    .where(
      and(
        eq(PaymentMeanTable.userId, userId),
        eq(PaymentMeanTable.webCardId, webCardId),
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
