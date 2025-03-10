import {
  createPayment,
  getSubscriptionByPaymentMeanId,
  transaction,
  updatePaymentMean,
  updateSubscription,
  updateSubscriptionByPaymentMeanId,
  getSubscriptionById,
  getPaymentByTransactionId,
} from '@azzapp/data';
import { login } from '#authent';
import client from './client';
import {
  getNextPaymentDate,
  calculateNextPaymentIntervalInMinutes,
  generateRebillFailRule,
  REBILL_MANAGER_REBILL_DURATION,
} from './helpers';
import type { UserSubscription } from '@azzapp/data';

export const acknowledgeFirstPayment = async (
  paymentMeanId: string,
  transactionId: string,
  paymentProviderResponse?: string,
) => {
  let paymentId: string | undefined;
  const subscription = await getSubscriptionByPaymentMeanId(paymentMeanId);

  const token = await login();

  if (subscription) {
    const foundPayment = await getPaymentByTransactionId(
      subscription.id,
      transactionId,
    );

    if (foundPayment.length === 0) {
      // If the subscription is found, we have to update the subscription and the payment mean to start billing
      const userId = subscription.userId;
      const amount = subscription.amount;
      const taxes = subscription.taxes;
      let maskedCard = '';

      if (subscription.subscriptionPlan && amount !== null && taxes !== null) {
        paymentId = await createPayment({
          status: 'paid',
          transactionId,
          subscriptionId: subscription.id,
          userId,
          amount,
          taxes,
          paymentMeanId,
          paymentProviderResponse,
        });

        const endAt = getNextPaymentDate(subscription.subscriptionPlan);

        const updates: Partial<UserSubscription> = {
          endAt,
        };

        const intervalInMinutes = calculateNextPaymentIntervalInMinutes(
          subscription.subscriptionPlan,
        );

        const paymentInfo = await client.GET(
          '/api/client-payment-request-results/{id}',
          {
            params: {
              path: { id: paymentMeanId },
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        maskedCard = paymentInfo.data?.maskedCard || '';

        const rebillManager = await client.POST(
          '/api/client-payment-requests/create-rebill-manager',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: {
              billing_description: `Subscription ${subscription.subscriptionPlan} for ${subscription.totalSeats} seats`,
              rebill_manager_initial_type: 'PAID',
              rebill_manager_initial_price_cnts: '0',
              rebill_manager_initial_duration_min: `${intervalInMinutes}`,
              rebill_manager_rebill_price_cnts: `${amount + taxes}`,
              rebill_manager_rebill_duration_mins:
                REBILL_MANAGER_REBILL_DURATION,
              rebill_manager_rebill_period_mins: `${intervalInMinutes}`,
              clientPaymentRequestUlid: paymentMeanId,
              rebill_manager_fail_rule: generateRebillFailRule(),
              rebill_manager_external_reference: subscription.id,
              rebill_manager_callback_url: `${process.env.NEXT_PUBLIC_URL}api/webhook/subscription`,
            },
          },
        );

        updates.rebillManagerId = rebillManager.data?.rebillManagerId;
        updates.status = 'active';

        if (
          !rebillManager.data ||
          (rebillManager.data.status as string) !== 'CREATED'
        ) {
          updates.status = 'canceled';
          updates.canceledAt = new Date();
        } else {
          updates.endAt = getNextPaymentDate(subscription.subscriptionPlan);
        }

        await transaction(async () => {
          updatePaymentMean(paymentMeanId, {
            status: 'active',
            maskedCard,
          });

          await updateSubscriptionByPaymentMeanId(paymentMeanId, updates);
        });

        if (!rebillManager.data) {
          throw new Error('Rebill manager creation failed', {
            cause: rebillManager.error,
          });
        }
      }
    } else {
      // If the subscription is not found, we just have to update the payment mean status (it's a new payment mean)
      const paymentInfo = await client.GET(
        '/api/client-payment-request-results/{id}',
        {
          params: {
            path: { id: paymentMeanId },
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (paymentInfo.data) {
        const maskedCard = paymentInfo.data.maskedCard || '';

        await updatePaymentMean(paymentMeanId, {
          status: 'active',
          maskedCard,
        });
      }
    }
    return { subscription, paymentId };
  }
};

export const rejectFirstPayment = async (
  paymentMeanId: string,
  transactionId?: string,
  paymentProviderResponse?: string,
) => {
  const subscription = await getSubscriptionByPaymentMeanId(paymentMeanId);

  if (subscription) {
    const userId = subscription.userId;
    const amount = subscription.amount;
    const taxes = subscription.taxes;

    if (subscription.subscriptionPlan && amount && taxes) {
      const errorDate = new Date();
      await transaction(async () => {
        await createPayment({
          status: 'failed',
          subscriptionId: subscription.id,
          userId,
          amount,
          taxes,
          paymentMeanId,
          transactionId,
          paymentProviderResponse,
          rebillManagerId: subscription.rebillManagerId,
        });

        await updatePaymentMean(paymentMeanId, {
          status: 'inactive',
        });

        await updateSubscriptionByPaymentMeanId(paymentMeanId, {
          status: 'canceled',
          canceledAt: errorDate,
          endAt: errorDate,
          lastPaymentError: true,
        });
      });
    } else {
      await updatePaymentMean(paymentMeanId, {
        status: 'inactive',
      });
    }
  }

  return subscription;
};

export const acknowledgeRecurringPayment = async (
  subscriptionId: string,
  rebillManagerId: string,
  transactionId: string,
  amount: number,
  paymentProviderResponse?: string,
) => {
  const subscription = await getSubscriptionById(subscriptionId);
  let paymentId: string | undefined;
  if (subscription) {
    const payment = await getPaymentByTransactionId(
      subscriptionId,
      transactionId,
    );

    if (payment.length === 0) {
      const userId = subscription.userId;
      let paymentAmount = subscription.amount ?? 0;
      let paymentTaxes = subscription.taxes ?? 0;

      if (paymentAmount + paymentTaxes !== amount) {
        //specific case for the first payment on updated subscription
        const tvaRate = Math.round((paymentTaxes / paymentAmount) * 100);
        paymentTaxes = Math.round((amount * tvaRate) / 100);
        paymentAmount = amount - paymentTaxes;
      }

      if (subscription.subscriptionPlan) {
        const endAt = getNextPaymentDate(subscription.subscriptionPlan);

        const updates: Partial<UserSubscription> = {
          endAt,
          lastPaymentError: false,
        };

        paymentId = await transaction(async () => {
          const id = await createPayment({
            status: 'paid',
            subscriptionId: subscription.id,
            userId,
            amount: paymentAmount,
            taxes: paymentTaxes,
            paymentMeanId: subscription.paymentMeanId ?? '',
            transactionId,
            paymentProviderResponse,
            rebillManagerId,
          });
          await updateSubscription(subscriptionId, updates);
          return id;
        });
      }
    }
  }

  return { subscription, paymentId };
};

export const rejectRecurringPayment = async (
  subscriptionId: string,
  transactionId?: string,
  paymentProviderResponse?: string,
) => {
  const subscription = await getSubscriptionById(subscriptionId);

  if (subscription) {
    const userId = subscription.userId;
    const amount = subscription.amount;
    const taxes = subscription.taxes;

    await transaction(async () => {
      if (subscription.subscriptionPlan && amount && taxes) {
        await createPayment({
          status: 'failed',
          subscriptionId: subscription.id,
          userId,
          amount,
          taxes,
          paymentMeanId: subscription.paymentMeanId ?? '',
          transactionId,
          paymentProviderResponse,
          rebillManagerId: subscription.rebillManagerId,
        });
      }

      await updateSubscription(subscriptionId, {
        // status: isRebillOn ? 'active': 'canceled', // we don’t automatically cancel the subscription for the moment (we prefer manual cancellation through backoffice)
        // canceledAt: isRebillOn? undefined: new Date(),
        lastPaymentError: true,
      });
    });
  }

  return subscription;
};
