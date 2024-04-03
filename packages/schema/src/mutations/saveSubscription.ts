import { GraphQLError } from 'graphql';
import { upsertSubscription } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#/__generated__/types';
import type { UserSubscription } from '@azzapp/data';

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
  if (issuer !== 'web' && !totalSeats) {
    totalSeatsFix = extractSeatsFromSubscriptionId(subscriptionId);
  } else if (issuer === 'web' && totalSeats) {
    totalSeatsFix = totalSeats;
  }

  const userSub: UserSubscription = {
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
      userSubscription: userSub,
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
