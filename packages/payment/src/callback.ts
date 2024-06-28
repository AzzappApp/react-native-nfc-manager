import { eq, and } from 'drizzle-orm';
import { createPayment, db, UserSubscriptionTable } from '@azzapp/data';
import { PaymentMeanTable } from '@azzapp/data/paymentMeans';
import { login } from '#authent';
import client from './client';
import {
  getNextPaymentDate,
  calculateNextPaymentIntervalInMinutes,
  generateRebillFailRule,
} from './helpers';
import type { UserSubscription } from '@azzapp/data';

export const acknowledgeFirstPayment = async (
  paymentMeanId: string,
  transactionId: string,
  paymentProviderResponse?: string,
) => {
  const subscriptions = await db
    .select()
    .from(UserSubscriptionTable)
    .where(eq(UserSubscriptionTable.paymentMeanId, paymentMeanId))
    .limit(1);

  const token = await login();

  if (subscriptions.length) {
    // If the subscription is found, we have to update the subscription and the payment mean to start billing
    const subscription = subscriptions[0];
    const webCardId = subscription.webCardId;
    const amount = subscription.amount;
    const taxes = subscription.taxes;
    let maskedCard = '';

    if (
      webCardId &&
      subscription.subscriptionPlan &&
      amount !== null &&
      taxes !== null
    ) {
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
            rebill_manager_initial_type: 'FREE',
            rebill_manager_initial_price_cnts: `0`,
            rebill_manager_initial_duration_min: `${intervalInMinutes}`,
            rebill_manager_rebill_price_cnts: `${amount}`,
            rebill_manager_rebill_duration_mins: `0`,
            rebill_manager_rebill_period_mins: `${intervalInMinutes}`,
            clientPaymentRequestUlid: paymentMeanId,
            rebill_manager_fail_rule: generateRebillFailRule(),
            rebill_manager_external_reference: subscription.subscriptionId,
            rebill_manager_callback_url: `${process.env.NEXT_PUBLIC_WEB_URL}/api/webhook/subscription`,
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

      await db.transaction(async tx => {
        await tx
          .update(PaymentMeanTable)
          .set({
            maskedCard,
            status: 'active',
          })
          .where(eq(PaymentMeanTable.id, paymentMeanId));

        await tx
          .update(UserSubscriptionTable)
          .set(updates)
          .where(eq(UserSubscriptionTable.paymentMeanId, paymentMeanId));

        await createPayment(
          {
            status: 'paid',
            transactionId,
            subscriptionId: subscription.id,
            webCardId,
            amount,
            taxes,
            paymentMeanId,
            paymentProviderResponse,
            rebillManagerId: rebillManager.data?.rebillManagerId,
          },
          tx,
        );
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

      await db
        .update(PaymentMeanTable)
        .set({
          status: 'active',
          maskedCard,
        })
        .where(eq(PaymentMeanTable.id, paymentMeanId));
    }
  }
};

export const rejectFirstPayment = async (
  paymentMeanId: string,
  transactionId?: string,
  paymentProviderResponse?: string,
) => {
  const subscriptions = await db
    .select()
    .from(UserSubscriptionTable)
    .where(eq(UserSubscriptionTable.paymentMeanId, paymentMeanId))
    .limit(1);

  if (subscriptions.length) {
    const subscription = subscriptions[0];
    const webCardId = subscription.webCardId;
    const amount = subscription.amount;
    const taxes = subscription.taxes;

    if (webCardId && subscription.subscriptionPlan && amount && taxes) {
      await db.transaction(async tx => {
        await createPayment(
          {
            status: 'failed',
            subscriptionId: subscription.id,
            webCardId,
            amount,
            taxes,
            paymentMeanId,
            transactionId,
            paymentProviderResponse,
            rebillManagerId: subscription.rebillManagerId,
          },
          tx,
        );

        await tx
          .update(PaymentMeanTable)
          .set({
            status: 'inactive',
          })
          .where(
            and(
              eq(PaymentMeanTable.id, paymentMeanId),
              eq(PaymentMeanTable.status, 'pending'),
            ),
          );

        await tx
          .update(UserSubscriptionTable)
          .set({
            status: 'canceled',
            canceledAt: new Date(),
            lastPaymentError: true,
          })
          .where(eq(UserSubscriptionTable.paymentMeanId, paymentMeanId));
      });
    } else {
      await db
        .update(PaymentMeanTable)
        .set({
          status: 'inactive',
        })
        .where(
          and(
            eq(PaymentMeanTable.id, paymentMeanId),
            eq(PaymentMeanTable.status, 'pending'),
          ),
        );
    }
  }
};

export const acknowledgeRecurringPayment = async (
  subscriptionId: string,
  transactionId: string,
  paymentProviderResponse?: string,
) => {
  const subscriptions = await db
    .select()
    .from(UserSubscriptionTable)
    .where(eq(UserSubscriptionTable.subscriptionId, subscriptionId))
    .limit(1);

  if (subscriptions.length) {
    const subscription = subscriptions[0];
    const webCardId = subscription.webCardId;
    const amount = subscription.amount;
    const taxes = subscription.taxes;

    if (webCardId && subscription.subscriptionPlan && amount && taxes) {
      const endAt = getNextPaymentDate(subscription.subscriptionPlan);

      const updates: Partial<UserSubscription> = {
        endAt,
        lastPaymentError: false,
      };

      await db.transaction(async tx => {
        await tx
          .update(UserSubscriptionTable)
          .set(updates)
          .where(eq(UserSubscriptionTable.subscriptionId, subscriptionId));

        await createPayment(
          {
            status: 'paid',
            subscriptionId: subscription.id,
            webCardId,
            amount,
            taxes,
            paymentMeanId: subscription.paymentMeanId ?? '',
            transactionId,
            paymentProviderResponse,
            rebillManagerId: subscription.rebillManagerId,
          },
          tx,
        );
      });
    }
  }
};

export const rejectRecurringPayment = async (
  subscriptionId: string,
  isRebillOn: boolean,
  transactionId?: string,
  paymentProviderResponse?: string,
) => {
  const subscriptions = await db
    .select()
    .from(UserSubscriptionTable)
    .where(eq(UserSubscriptionTable.subscriptionId, subscriptionId))
    .limit(1);

  if (subscriptions.length) {
    const subscription = subscriptions[0];
    const webCardId = subscription.webCardId;
    const amount = subscription.amount;
    const taxes = subscription.taxes;

    await db.transaction(async tx => {
      if (webCardId && subscription.subscriptionPlan && amount && taxes) {
        await createPayment(
          {
            status: 'failed',
            subscriptionId: subscription.id,
            webCardId,
            amount,
            taxes,
            paymentMeanId: subscription.paymentMeanId ?? '',
            transactionId,
            paymentProviderResponse,
            rebillManagerId: subscription.rebillManagerId,
          },
          tx,
        );
      }

      await tx
        .update(UserSubscriptionTable)
        .set({
          // status: isRebillOn ? 'active': 'canceled', // we don’t automatically cancel the subscription for the moment (we prefer manual cancellation through backoffice)
          // canceledAt: isRebillOn? undefined: new Date(),
          lastPaymentError: true,
        })
        .where(eq(UserSubscriptionTable.subscriptionId, subscriptionId));
    });
  }
};
