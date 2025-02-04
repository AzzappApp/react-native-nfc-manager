import {
  createId,
  createSubscription,
  getSubscriptionById,
  transaction,
  updateSubscription,
} from '@azzapp/data';
import { dateDiffInMinutes } from '@azzapp/shared/timeHelpers';
import { login } from '#authent';
import client from '#client';
import {
  calculateAmount,
  calculateNextPaymentIntervalInMinutes,
  calculateTaxes,
  generateRebillFailRule,
  MONTHLY_RECURRENCE,
  YEARLY_RECURRENCE,
} from '#helpers';
import type { Customer } from '#types';
import type { UserSubscription } from '@azzapp/data';

export const updateActiveSubscription = async ({
  subscription,
  totalSeats,
  paymentMeanId,
}: {
  subscription: UserSubscription;
  totalSeats?: number | null;
  paymentMeanId?: string | null;
}) => {
  if (subscription.status === 'canceled') {
    throw new Error('Subscription is canceled');
  }

  return updateExistingSubscription({
    userSubscription: subscription,
    totalSeats,
    paymentMeanId,
  });
};

export const estimateUpdateSubscriptionForWebCard = async ({
  subscription,
  totalSeats,
}: {
  subscription: UserSubscription;
  totalSeats?: number | null;
}) => {
  return calculateSubscriptionUpdate(subscription, totalSeats);
};

const calculateSubscriptionUpdate = async (
  existingSubscription: UserSubscription,
  totalSeats?: number | null,
) => {
  if (existingSubscription.subscriptionPlan === 'web.monthly') {
    const amount = totalSeats
      ? calculateAmount(totalSeats, existingSubscription.subscriptionPlan)
      : existingSubscription.amount;

    const { amount: taxes, rate } = totalSeats
      ? await calculateTaxes(
          amount ?? 0,
          existingSubscription.subscriberCountryCode ?? undefined,
          existingSubscription.subscriberVatNumber ?? undefined,
        )
      : { amount: 0 };

    return {
      firstPayment: null,
      firstPaymentNbMonths: null,
      recurringCost: {
        amount: amount ?? 0,
        taxes,
        taxRate: rate ?? 0,
      },
    };
  } else if (existingSubscription.subscriptionPlan === 'web.yearly') {
    if (totalSeats && existingSubscription.totalSeats > totalSeats) {
      throw new Error('Cannot update to a lower number of seats');
    }

    const currentDate = new Date();

    const intervalInMonths = Math.floor(
      existingSubscription.endAt.getTime() -
        currentDate.getTime() / MONTHLY_RECURRENCE,
    );

    const amountForTheRestOfTheYear = totalSeats
      ? Math.floor(
          (calculateAmount(
            totalSeats - existingSubscription.totalSeats,
            existingSubscription.subscriptionPlan,
          ) *
            intervalInMonths) /
            Math.floor(YEARLY_RECURRENCE / MONTHLY_RECURRENCE),
        )
      : 0;

    const { amount: taxesForTheRestOfTheYear, rate: rateForTheRestOfTheYear } =
      totalSeats
        ? await calculateTaxes(
            amountForTheRestOfTheYear,
            existingSubscription.subscriberCountryCode ?? undefined,
            existingSubscription.subscriberVatNumber ?? undefined,
          )
        : { amount: 0 };

    const amount = totalSeats
      ? calculateAmount(totalSeats, existingSubscription.subscriptionPlan)
      : existingSubscription.amount;

    const { amount: taxes, rate } = totalSeats
      ? await calculateTaxes(
          amount ?? 0,
          existingSubscription.subscriberCountryCode ?? undefined,
          existingSubscription.subscriberVatNumber ?? undefined,
        )
      : { amount: 0 };

    return {
      firstPayment:
        intervalInMonths > 0
          ? {
              amount: amountForTheRestOfTheYear ?? 0,
              taxes: taxesForTheRestOfTheYear,
              taxRate: rateForTheRestOfTheYear ?? 0,
            }
          : undefined,
      firstPaymentNbMonths: intervalInMonths > 0 ? intervalInMonths : 0,
      recurringCost: {
        amount: amount ?? 0,
        taxes,
        taxRate: rate ?? 0,
      },
    };
  }
  throw new Error('Invalid subscription plan');
};

export const updateExistingSubscription = async ({
  userSubscription: existingSubscription,
  totalSeats,
  paymentMeanId,
}: {
  userSubscription: UserSubscription;
  totalSeats?: number | null;
  paymentMeanId?: string | null;
}) => {
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

  let newSubscriptionId = existingSubscription.id;

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

      const { recurringCost } = await calculateSubscriptionUpdate(
        existingSubscription,
        totalSeats,
      );
      const intervalInMinutes = calculateNextPaymentIntervalInMinutes(
        existingSubscription.subscriptionPlan,
      );

      const currentDate = new Date();
      const endDate = existingSubscription.endAt;

      const timeUntilNextPayment = dateDiffInMinutes(currentDate, endDate);

      newSubscriptionId = createId();

      const rebillManager = await client.POST(
        '/api/client-payment-requests/create-rebill-manager',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            billing_description: `Subscription ${existingSubscription.subscriptionPlan} for ${totalSeats} seats`,
            rebill_manager_initial_type: 'PAID',
            rebill_manager_initial_price_cnts: '0',
            rebill_manager_initial_duration_min: `${timeUntilNextPayment}`,
            rebill_manager_rebill_price_cnts: `${recurringCost.amount + recurringCost.taxes}`,
            rebill_manager_rebill_duration_mins: `0`,
            rebill_manager_rebill_period_mins: `${intervalInMinutes}`,
            clientPaymentRequestUlid: existingSubscription.paymentMeanId,
            rebill_manager_fail_rule: generateRebillFailRule(),
            rebill_manager_external_reference: newSubscriptionId,
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

      const newSubscription: UserSubscription = {
        ...existingSubscription,
        subscriptionId: newSubscriptionId,
        id: newSubscriptionId,
        totalSeats: totalSeats ?? existingSubscription.totalSeats,
        amount: recurringCost.amount,
        taxes: recurringCost.taxes,
        rebillManagerId: newRebillManagerId,
        canceledAt: null,
        status: 'active',
        startAt: currentDate,
        paymentMeanId: newPaymentMean,
      };

      await transaction(async () => {
        await createSubscription(newSubscription);
        await updateSubscription(existingSubscription.id, {
          canceledAt: currentDate,
          status: 'canceled',
          endAt: currentDate,
        });
      });
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

    const currentDate = new Date();

    const intervalInMinutes = dateDiffInMinutes(
      currentDate,
      existingSubscription.endAt,
    );

    const { firstPayment, recurringCost } = await calculateSubscriptionUpdate(
      existingSubscription,
      totalSeats,
    );

    newSubscriptionId = createId();

    const rebillManager = await client.POST(
      '/api/client-payment-requests/create-rebill-manager',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          billing_description: `Subscription ${existingSubscription.subscriptionPlan} for ${totalSeats} seats`,
          rebill_manager_initial_type: 'PAID',
          rebill_manager_initial_price_cnts: `${(firstPayment?.amount ?? recurringCost.amount) + (firstPayment?.taxes ?? recurringCost.taxes)}`,
          rebill_manager_initial_duration_min: `${firstPayment ? intervalInMinutes : calculateNextPaymentIntervalInMinutes(existingSubscription.subscriptionPlan)}`,
          rebill_manager_rebill_price_cnts: `${recurringCost.amount + recurringCost.taxes}`,
          rebill_manager_rebill_duration_mins: '0',
          rebill_manager_rebill_period_mins: `${calculateNextPaymentIntervalInMinutes(existingSubscription.subscriptionPlan)}`,
          clientPaymentRequestUlid: existingSubscription.paymentMeanId,
          rebill_manager_fail_rule: generateRebillFailRule(),
          rebill_manager_external_reference: newSubscriptionId,
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

    const newSubscription: UserSubscription = {
      ...existingSubscription,
      subscriptionId: newSubscriptionId,
      id: newSubscriptionId,
      totalSeats: totalSeats ?? existingSubscription.totalSeats,
      amount: recurringCost.amount,
      taxes: recurringCost.taxes,
      rebillManagerId: newRebillManagerId,
      canceledAt: null,
      status: 'active',
      startAt: currentDate,
    };

    await transaction(async () => {
      await createSubscription(newSubscription);
      await updateSubscription(existingSubscription.id, {
        canceledAt: currentDate,
        status: 'canceled',
        endAt: currentDate,
      });
    });
  }

  return (await getSubscriptionById(newSubscriptionId))!;
};

export const upgradePlan = async (existingSubscription: UserSubscription) => {
  if (existingSubscription.status === 'canceled') {
    throw new Error('Subscription is canceled');
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
    const rebillManagerId = existingSubscription.rebillManagerId;
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
              stopReason: `Upgrade subscription to web.yearly`,
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

    const newSubscriptionId = createId();

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
          rebill_manager_external_reference: newSubscriptionId,
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

    const currentDate = new Date();

    const newSubscription: UserSubscription = {
      ...existingSubscription,
      subscriptionId: newSubscriptionId,
      id: newSubscriptionId,
      subscriptionPlan: 'web.yearly',
      amount,
      taxes,
      rebillManagerId: rebillManager.data.rebillManagerId,
      canceledAt: null,
      status: 'active',
      startAt: currentDate,
    };

    await transaction(async () => {
      await createSubscription(newSubscription);
      await updateSubscription(existingSubscription.id, {
        canceledAt: currentDate,
        status: 'canceled',
        endAt: currentDate,
      });
    });

    return (await getSubscriptionById(newSubscriptionId))!;
  } else {
    throw new Error('Cannot upgrade plan for yearly subscription');
  }
};

export const endSubscription = async (
  existingSubscription: UserSubscription,
) => {
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

    await updateSubscription(existingSubscription.id, {
      canceledAt: new Date(),
      status: 'canceled',
    });
    return (await getSubscriptionById(existingSubscription.id))!;
  }
};

export const updateCustomer = async (
  subscription: UserSubscription,
  customer: Customer,
) => {
  const updates = {
    subscriberName: customer.name,
    subscriberEmail: customer.email,
    subscriberPhoneNumber: customer.phone ?? null,
    subscriberAddress: customer.address,
    subscriberCity: customer.city,
    subscriberZip: customer.zip,
    subscriberCountry: customer.country,
    subscriberCountryCode: customer.countryCode,
    subscriberVatNumber: customer.vatNumber ?? null,
  };

  await updateSubscription(subscription.id, updates);
  return {
    ...subscription,
    ...updates,
  };
};

export const renewUserSubscription = async (
  subscription: UserSubscription,
  userId: string,
) => {
  if (!subscription.paymentMeanId || !subscription.rebillManagerId) {
    throw new Error('Nothing to resume');
  }

  if (subscription.endAt < new Date()) {
    throw new Error('Subscription has already ended');
  }

  if (subscription.status === 'active') {
    throw new Error('Subscription is already active');
  }

  const token = await login();

  const rebillManagerId = subscription.rebillManagerId;

  const result = await client.POST(
    '/api/client-payment-requests/resume-rebill-manager',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        rebillManagerId,
        clientPaymentRequestUlid: subscription.paymentMeanId,
        resumeReason: `resumed by user with id ${userId}`,
      },
    },
  );

  if (!result.data) {
    throw new Error('Failed to resume rebill manager', {
      cause: result.error,
    });
  }

  await updateSubscription(subscription.id, {
    canceledAt: null,
    status: 'active',
  });
  return (await getSubscriptionById(subscription.id))!;
};
