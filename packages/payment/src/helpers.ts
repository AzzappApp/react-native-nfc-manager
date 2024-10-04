import ms from 'ms';
import { sha256 } from '@azzapp/shared/crypto';
import { getTaxRate } from '#taxes';
import type { UserSubscription } from '@azzapp/data';

export type SubscriptionPlan = UserSubscription['subscriptionPlan'];

export const MONTHLY_RECURRENCE = ms(
  process.env.PAYMENT_MONTHLY_RECURRENCE ?? '30d',
);
export const YEARLY_RECURRENCE = ms(
  process.env.PAYMENT_YEARLY_RECURRENCE ?? '365d',
);

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
  endAt.setDate((previousEndDate?.getDate() ?? 0) + endAt.getDate());
  endAt.setTime(
    endAt.getTime() +
      (subscriptionPlan === 'web.monthly'
        ? MONTHLY_RECURRENCE
        : YEARLY_RECURRENCE),
  );

  return endAt;
};

export const calculateAmount = (
  totalSeats: number,
  subscriptionPlan: SubscriptionPlan,
) => {
  return Math.round(
    (subscriptionPlan === 'web.monthly'
      ? totalSeats * 1.2
      : totalSeats * 0.99) *
      100 *
      (subscriptionPlan === 'web.monthly'
        ? 1
        : Math.floor(YEARLY_RECURRENCE / MONTHLY_RECURRENCE)),
  ); // cents;
};

export const calculateTaxes = async (
  amount: number,
  countryCode?: string,
  vatNumber?: string,
) => {
  const taxRate = await getTaxRate(countryCode, vatNumber);
  return {
    rate: taxRate,
    amount: Math.round(taxRate * amount),
  };
};

export const calculateNextPaymentIntervalInMinutes = (
  subscriptionPlan: SubscriptionPlan,
) => {
  return subscriptionPlan === 'web.monthly'
    ? Math.floor(MONTHLY_RECURRENCE / 60000)
    : Math.floor(YEARLY_RECURRENCE / 60000);
};

export const generateRebillFailRule = () => {
  return 'PT1H:PT24H:P2D';
};

type Params = { [key: string]: any };

const SIGNATURE_PASSWORD = process.env.PAYMENT_API_SECRET;

export const signature = async (params: Params = {}): Promise<string> => {
  const stack: string[] = [];
  const query: string[] = [];

  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result: Params, key: string) => {
      result[key] = params[key];
      return result;
    }, {});

  for (const [key, value] of Object.entries(sortedParams)) {
    if (key === 'HASH' && stack.length === 0) {
      continue;
    }
    if (!Array.isArray(value) && typeof value !== 'object') {
      if (stack.length > 0) {
        query.push(stack.join('') + '[' + key + ']=' + value);
      } else {
        query.push(key + '=' + value);
      }
    } else {
      stack.push(stack.length > 0 ? '[' + key + ']' : key);
      query.push(await signature(value));
      stack.pop();
    }
  }

  if (stack.length === 0) {
    const result =
      SIGNATURE_PASSWORD + query.join(SIGNATURE_PASSWORD) + SIGNATURE_PASSWORD;
    return sha256(result);
  } else {
    return query.join(SIGNATURE_PASSWORD);
  }
};

export const checkSignature = async (
  params: Params,
  hashToCheck: string,
): Promise<boolean> => {
  const generatedHash = await signature(params);
  return generatedHash === hashToCheck;
};
