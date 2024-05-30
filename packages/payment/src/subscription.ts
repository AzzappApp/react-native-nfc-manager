import { eq } from 'drizzle-orm';
import { UserSubscriptionTable, db, getSubscriptionById } from '@azzapp/data';
import { createId } from '@azzapp/data/helpers/createId';
import {
  dateDiffInMinutes,
  dateDiffInMonths,
} from '@azzapp/shared/timeHelpers';
import { login } from '#authent';
import client from '#client';
import {
  calculateAmount,
  calculateNextPaymentIntervalInMinutes,
  calculateTaxes,
  generateRebillFailRule,
} from '#helpers';
import type { Customer } from '#types';
import type { UserSubscription } from '@azzapp/data';
import type { DbTransaction } from '@azzapp/data/db';

export const updateSubscriptionForWebCard = async ({
  subscriptionId,
  webCardId,
  totalSeats,
  paymentMeanId,
}: {
  subscriptionId: string;
  webCardId: string;
  totalSeats?: number | null;
  paymentMeanId?: string | null;
}) => {
  const existingSubscription = await getSubscriptionById(subscriptionId);

  if (!existingSubscription) {
    throw new Error('No subscription found');
  }

  if (existingSubscription.status === 'canceled') {
    throw new Error('Subscription is canceled');
  }

  if (existingSubscription.webCardId !== webCardId) {
    throw new Error('Web card id does not match');
  }

  return updateExistingSubscription({
    userSubscription: existingSubscription,
    totalSeats,
    paymentMeanId,
  });
};

export const updateExistingSubscription = async (
  {
    userSubscription: existingSubscription,
    totalSeats,
    paymentMeanId,
  }: {
    userSubscription: UserSubscription;
    totalSeats?: number | null;
    paymentMeanId?: string | null;
  },
  trx: DbTransaction = db,
) => {
  if (
    existingSubscription.subscriptionPlan !== 'web.monthly' &&
    existingSubscription.subscriptionPlan !== 'web.yearly'
  ) {
    throw new Error('Invalid subscription plan');
  }

  if (!totalSeats && !paymentMeanId) {
    //nothing to update
    return existingSubscription;
  }

  const token = await login();

  const newPaymentMean = paymentMeanId ?? existingSubscription.paymentMeanId;

  if (existingSubscription.webCardId === null) {
    throw new Error('No web card id found');
  }

  if (existingSubscription.subscriptionPlan === 'web.monthly') {
    //update amount of next subscription

    const rebillManagerId = existingSubscription.rebillManagerId;

    if (existingSubscription.paymentMeanId) {
      if (rebillManagerId) {
        const state = await client.POST(
          `/api/client-payment-requests/check-rebill-manager`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: {
              rebillManagerId,
              clientPaymentRequestUlid: existingSubscription.paymentMeanId,
            },
          },
        );

        if (!state.data) {
          throw new Error('Failed to check rebill manager', {
            cause: state.error,
          });
        }

        if (state.data.rebill_manager_state === 'ON') {
          const result = await client.POST(
            '/api/client-payment-requests/stop-rebill-manager',
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: {
                rebillManagerId,
                clientPaymentRequestUlid: existingSubscription.paymentMeanId,
                stopReason: `Update subscription to ${totalSeats} seats with payment mean ${newPaymentMean}`,
              },
            },
          );

          if (!result.data) {
            throw new Error('Failed to stop rebill manager', {
              cause: result.error,
            });
          }

          if ((result.data.status as string) !== 'STOPPED') {
            throw new Error(
              result.data.reason || 'Failed to stop rebill manager',
            );
          }
        }
      }

      const amount = totalSeats
        ? calculateAmount(totalSeats, existingSubscription.subscriptionPlan)
        : existingSubscription.amount;

      const { amount: taxes } = totalSeats
        ? await calculateTaxes(
            amount ?? 0,
            existingSubscription.subscriberCountryCode ?? undefined,
            existingSubscription.subscriberVatNumber ?? undefined,
          )
        : { amount: 0 };

      const intervalInMinutes = calculateNextPaymentIntervalInMinutes(
        existingSubscription.subscriptionPlan,
      );

      const currentDate = new Date();
      const endDate = existingSubscription.endAt;

      const timeUntilNextPayment = dateDiffInMinutes(currentDate, endDate);

      const subscriptionId = createId();

      const rebillManager = await client.POST(
        '/api/client-payment-requests/create-rebill-manager',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            billing_description: `Subscription ${existingSubscription.subscriptionPlan} for ${totalSeats} seats`,
            rebill_manager_initial_type: 'FREE',
            rebill_manager_initial_price_cnts: '0',
            rebill_manager_initial_duration_min: `${timeUntilNextPayment}`,
            rebill_manager_rebill_price_cnts: `${(amount ?? 0) + taxes}`,
            rebill_manager_rebill_duration_mins: `0`,
            rebill_manager_rebill_period_mins: `${intervalInMinutes}`,
            clientPaymentRequestUlid: existingSubscription.paymentMeanId,
            rebill_manager_fail_rule: generateRebillFailRule(),
            rebill_manager_external_reference: subscriptionId,
            rebill_manager_callback_url: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/webhook/subscription`,
          },
        },
      );

      if (!rebillManager.data) {
        throw new Error('Failed to create rebill manager', {
          cause: rebillManager.error,
        });
      }

      if ((rebillManager.data.status as string) !== 'CREATED') {
        throw new Error(
          rebillManager.data.reason || 'Failed to create rebill manager',
        );
      }

      const newRebillManagerId = rebillManager.data.rebillManagerId;

      await trx
        .update(UserSubscriptionTable)
        .set({
          totalSeats: totalSeats ?? existingSubscription.totalSeats,
          rebillManagerId: newRebillManagerId,
          subscriptionId,
          canceledAt: null,
          status: 'active',
          paymentMeanId: newPaymentMean,
          amount,
          taxes,
        })
        .where(eq(UserSubscriptionTable.id, existingSubscription.id));
    } else {
      throw new Error('No payment mean found');
    }
  } else if (
    existingSubscription.subscriptionPlan === 'web.yearly' &&
    existingSubscription.paymentMeanId
  ) {
    //update amount of next subscription for yearly

    if (totalSeats && existingSubscription.totalSeats > totalSeats) {
      throw new Error('Cannot update to a lower number of seats');
    }

    const rebillManagerId = existingSubscription.rebillManagerId;

    if (rebillManagerId) {
      const result = await client.POST(
        '/api/client-payment-requests/stop-rebill-manager',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            rebillManagerId,
            clientPaymentRequestUlid: existingSubscription.paymentMeanId,
            stopReason: `Update subscription to ${totalSeats} seats`,
          },
        },
      );

      if (!result.data) {
        throw new Error('Failed to stop rebill manager', {
          cause: result.error,
        });
      }

      //returned status is STOPPED instead of OK so we check id instead
      if (!result.data.rebillManagerId) {
        throw new Error(result.data.reason || 'Failed to stop rebill manager');
      }
    }

    const intervalInMonths = dateDiffInMonths(
      new Date(),
      existingSubscription.endAt,
    );

    const intervalInMinutes = dateDiffInMinutes(
      new Date(),
      existingSubscription.endAt,
    );

    const amountForTheRestOfTheYear = totalSeats
      ? Math.floor(
          (calculateAmount(
            totalSeats - existingSubscription.totalSeats,
            existingSubscription.subscriptionPlan,
          ) *
            intervalInMonths) /
            12,
        )
      : 0;

    const { amount: taxesForTheRestOfTheYear } = totalSeats
      ? await calculateTaxes(
          amountForTheRestOfTheYear,
          existingSubscription.subscriberCountryCode ?? undefined,
          existingSubscription.subscriberVatNumber ?? undefined,
        )
      : { amount: 0 };

    const amount = totalSeats
      ? calculateAmount(totalSeats, existingSubscription.subscriptionPlan)
      : existingSubscription.amount;

    const { amount: taxes } = totalSeats
      ? await calculateTaxes(
          amount ?? 0,
          existingSubscription.subscriberCountryCode ?? undefined,
          existingSubscription.subscriberVatNumber ?? undefined,
        )
      : { amount: 0 };

    const subscriptionId = createId();

    const rebillManager = await client.POST(
      '/api/client-payment-requests/create-rebill-manager',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          billing_description: `Subscription ${existingSubscription.subscriptionPlan} for ${totalSeats} seats`,
          rebill_manager_initial_type: 'PAID',
          rebill_manager_initial_price_cnts: `${amountForTheRestOfTheYear + taxesForTheRestOfTheYear}`,
          rebill_manager_initial_duration_min: `${intervalInMinutes}`,
          rebill_manager_rebill_price_cnts: `${(amount ?? 0) + taxes}`,
          rebill_manager_rebill_duration_mins: '0',
          rebill_manager_rebill_period_mins: `${calculateNextPaymentIntervalInMinutes(existingSubscription.subscriptionPlan)}`,
          clientPaymentRequestUlid: existingSubscription.paymentMeanId,
          rebill_manager_fail_rule: generateRebillFailRule(),
          rebill_manager_external_reference: subscriptionId,
          rebill_manager_callback_url: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/webhook/subscription`,
        },
      },
    );

    if (!rebillManager.data) {
      throw new Error('Failed to create rebill manager', {
        cause: rebillManager.error,
      });
    }

    if ((rebillManager.data.status as string) !== 'CREATED') {
      throw new Error(
        rebillManager.data.reason || 'Failed to create rebill manager',
      );
    }

    const newRebillManagerId = rebillManager.data.rebillManagerId;

    await trx
      .update(UserSubscriptionTable)
      .set({
        totalSeats: totalSeats ?? existingSubscription.totalSeats,
        amount,
        taxes,
        rebillManagerId: newRebillManagerId,
        subscriptionId,
        canceledAt: null,
        status: 'active',
      })
      .where(eq(UserSubscriptionTable.id, existingSubscription.id));
  }

  return (await getSubscriptionById(existingSubscription.id))!;
};

export const upgradePlan = async (
  webCardId: string,
  subscriptionId: string,
) => {
  const existingSubscription = await getSubscriptionById(subscriptionId);

  if (!existingSubscription) {
    throw new Error('No subscription found');
  }

  if (existingSubscription.status === 'canceled') {
    throw new Error('Subscription is canceled');
  }

  if (existingSubscription.webCardId !== webCardId) {
    throw new Error('Web card id does not match');
  }

  if (!existingSubscription.paymentMeanId) {
    throw new Error('No payment mean found');
  }

  if (existingSubscription.subscriptionPlan === 'web.monthly') {
    const intervalInMinutesForPreviousSubscription = dateDiffInMinutes(
      new Date(),
      existingSubscription.endAt,
    );

    const amount = calculateAmount(
      existingSubscription.totalSeats,
      'web.yearly',
    );

    const { amount: taxes } = await calculateTaxes(
      amount,
      existingSubscription.subscriberCountryCode ?? undefined,
      existingSubscription.subscriberVatNumber ?? undefined,
    );

    const intervalInMinutes =
      calculateNextPaymentIntervalInMinutes('web.yearly');

    const token = await login();

    const subscriptionId = createId();

    const rebillManager = await client.POST(
      '/api/client-payment-requests/create-rebill-manager',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          billing_description: `Subscription web.yearly for ${existingSubscription.totalSeats} seats`,
          rebill_manager_initial_type: 'PAID',
          rebill_manager_initial_price_cnts: `${amount + taxes}`,
          rebill_manager_initial_duration_min: `${intervalInMinutes + intervalInMinutesForPreviousSubscription}`,
          rebill_manager_rebill_price_cnts: `${amount + taxes}`,
          rebill_manager_rebill_duration_mins: `0`,
          rebill_manager_rebill_period_mins: `${intervalInMinutes}`,
          clientPaymentRequestUlid: existingSubscription.paymentMeanId,
          rebill_manager_fail_rule: generateRebillFailRule(),
          rebill_manager_external_reference: subscriptionId,
          rebill_manager_callback_url: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/webhook/subscription`,
        },
      },
    );

    if (!rebillManager.data) {
      throw rebillManager.error;
    }

    if ((rebillManager.data.status as string) !== 'CREATED') {
      throw new Error(
        rebillManager.data.reason || 'Failed to create rebill manager',
      );
    }

    await db
      .update(UserSubscriptionTable)
      .set({
        canceledAt: null,
        status: 'active',
        subscriptionPlan: 'web.yearly',
        rebillManagerId: rebillManager.data.rebillManagerId,
        amount,
        taxes,
        subscriptionId,
      })
      .where(eq(UserSubscriptionTable.id, existingSubscription.id));
    return (await getSubscriptionById(existingSubscription.id))!;
  } else {
    throw new Error('Cannot upgrade plan for yearly subscription');
  }
};

export const endSubscription = async (
  webCardId: string,
  subscriptionId: string,
) => {
  const existingSubscription = await getSubscriptionById(subscriptionId);

  if (!existingSubscription) {
    throw new Error('No subscription found');
  }

  if (existingSubscription.webCardId !== webCardId) {
    throw new Error('Web card id does not match');
  }

  const token = await login();

  const rebillManagerId = existingSubscription.rebillManagerId;

  if (rebillManagerId && existingSubscription.paymentMeanId) {
    const state = await client.POST(
      `/api/client-payment-requests/check-rebill-manager`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          rebillManagerId,
          clientPaymentRequestUlid: existingSubscription.paymentMeanId,
        },
      },
    );

    if (!state.data) {
      throw new Error('Failed to check rebill manager', {
        cause: state.error,
      });
    }

    if (state.data.rebill_manager_state === 'ON') {
      const result = await client.POST(
        '/api/client-payment-requests/stop-rebill-manager',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            rebillManagerId,
            clientPaymentRequestUlid: existingSubscription.paymentMeanId,
            stopReason: 'End subscription',
          },
        },
      );

      if (!result.data) {
        throw new Error('Failed to stop rebill manager', {
          cause: result.error,
        });
      }

      if ((result.data.status as string) !== 'STOPPED') {
        throw new Error(result.data.reason || 'Failed to stop rebill manager');
      }
    }

    await db
      .update(UserSubscriptionTable)
      .set({
        canceledAt: new Date(),
        status: 'canceled',
      })
      .where(eq(UserSubscriptionTable.id, existingSubscription.id));

    return (await getSubscriptionById(existingSubscription.id))!;
  }
};

export const updateCustomer = async (
  webCardId: string,
  subscriptionId: string,
  customer: Customer,
) => {
  const subscription = await getSubscriptionById(subscriptionId);

  if (!subscription) {
    throw new Error('No subscription found');
  }

  if (subscription.webCardId !== webCardId) {
    throw new Error('Web card id does not match');
  }

  const updates = {
    subscriberName: customer.name,
    subscriberEmail: customer.email,
    subscriberPhoneNumber: customer.phoneNumber ?? null,
    subscriberAddress: customer.address,
    subscriberCity: customer.city,
    subscriberZip: customer.zip,
    subscriberCountry: customer.country,
    subscriberCountryCode: customer.countryCode,
    subscriberVatNumber: customer.vatNumber ?? null,
  };

  await db
    .update(UserSubscriptionTable)
    .set(updates)
    .where(eq(UserSubscriptionTable.id, subscriptionId));

  return {
    ...subscription,
    ...updates,
  };
};
