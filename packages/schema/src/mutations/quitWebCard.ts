import { GraphQLError } from 'graphql';
import {
  markWebCardAsDeleted,
  getActiveWebCardSubscription,
  removeProfile,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { updateMonthlySubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

type Mutation = MutationResolvers['quitWebCard'];

const quitWebCard: Mutation = async (
  _,
  params,
  { loaders, auth, cardUsernamesToRevalidate },
) => {
  const webCardId = fromGlobalIdWithType(params.webCardId, 'WebCard');

  const { userId } = auth;
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.profileByWebCardIdAndUserId.load({
    webCardId,
    userId,
  });

  const webCard = await loaders.WebCard.load(webCardId);

  if (!profile) {
    throw new GraphQLError(ERRORS.PROFILE_DONT_EXISTS);
  }

  if (profile?.profileRole === 'owner') {
    await transaction(async () => {
      const subscription = await getActiveWebCardSubscription(
        profile.webCardId,
      );

      if (subscription) {
        throw new GraphQLError(ERRORS.SUBSCRIPTION_IS_ACTIVE);
      }

      await markWebCardAsDeleted(profile.webCardId, auth.userId ?? '');
    });
    if (webCard) {
      cardUsernamesToRevalidate.add(webCard.userName);
    }
  } else {
    await transaction(async () => {
      await removeProfile(profile.id);
      await updateMonthlySubscription(userId, profile.webCardId);
    });
  }

  return {
    webCardId: params.webCardId,
  };
};

export default quitWebCard;
