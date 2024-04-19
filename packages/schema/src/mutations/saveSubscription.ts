import { GraphQLError } from 'graphql';
import { upsertSubscription } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#/__generated__/types';

const saveSubscription: MutationResolvers['saveSubscription'] = async (
  _,
  {
    input: { subscriptionId, startAt, endAt, revenueCatId, issuer, totalSeats },
  },
  { auth },
) => {
  const { userId } = auth;

  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  let totalSeatsFix = 0;
  if (!totalSeats) {
    totalSeatsFix = extractSeatsFromSubscriptionId(subscriptionId);
  }

  const userSub = {
    userId,
    subscriptionId,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    revenueCatId: revenueCatId ?? null,
    issuer,
    totalSeats: totalSeatsFix,
  };

  try {
    await upsertSubscription(userSub);

    return {
      userSubscription: {
        ...userSub,
        subscriberEmail: '',
        subscriberPhoneNumber: '',
        subscriberName: '',
        subscriberAddress: '',
        subscriberCity: '',
        subscriberCountry: '',
        subscriberVatNumber: '',
        subscriberZip: '',
        paymentIntentId: null,
        webCardId: '',
        paymentIntentUlId: '',
        subscriptionPlan: null,
        amount: null,
        taxes: null,
        rebillManagerId: null,
        paymentMeanId: '',
        canceledAt: null,
        status: 'active',
      },
    };
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default saveSubscription;

function extractSeatsFromSubscriptionId(id: string) {
  const parts = id.split('.');
  const number = parts.pop();
  if (number) {
    return parseInt(number, 10);
  }
  return 0;
}
