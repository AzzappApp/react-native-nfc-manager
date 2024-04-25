import { getTaxRate } from '#taxes';
import type { UserSubscription } from '@azzapp/data';

export type SubscriptionPlan = UserSubscription['subscriptionPlan'];

/**
 *
 * @param subscriptionPlan
 * @param previousEndDate is the end date of the previous subscription
 * @returns  30 days for monthly subscription and 365 days for yearly subscription
 */
export const getNextPaymentDate = (
  subscriptionPlan: SubscriptionPlan,
  previousEndDate?: Date,
) => {
  const endAt = new Date();
  endAt.setDate(
    (previousEndDate?.getDate() ?? 0) +
      endAt.getDate() +
      (subscriptionPlan === 'web.monthly' ? 30 : 365),
  );

  return endAt;
};

export const calculateAmount = (
  totalSeats: number,
  subscriptionPlan: SubscriptionPlan,
) => {
  return (
    (subscriptionPlan === 'web.monthly'
      ? totalSeats * 1.2
      : totalSeats * 0.99) * 100
  ); // cents;
};

export const calculateTaxes = async (
  amount: number,
  countryCode?: string,
  vatNumber?: string,
) => {
  const taxRate = await getTaxRate(countryCode, vatNumber);
  return Math.round(taxRate * amount);
};

export const calculateNextPaymentIntervalInMinutes = (
  subscriptionPlan: SubscriptionPlan,
) => {
  return subscriptionPlan === 'web.monthly' ? 30 * 24 * 60 : 365 * 24 * 60;
};

export const generateRebillFailRule = () => {
  return 'PT1H:PT24H:P2D';
};
