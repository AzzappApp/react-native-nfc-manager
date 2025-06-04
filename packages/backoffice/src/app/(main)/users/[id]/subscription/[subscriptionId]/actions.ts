'use server';

import { revalidatePath } from 'next/cache';
import { refundPayment } from '@azzapp/payment';
import getCurrentUser from '#helpers/getCurrentUser';

export const refundPaymentAction = async (paymentId: string) => {
  const user = await getCurrentUser();
  if (user) {
    const payment = await refundPayment(paymentId, user.id);
    revalidatePath(
      `/users/${payment.userId}/subscription/${payment.subscriptionId}`,
    );
  }
};
