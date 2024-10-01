import { GraphQLError } from 'graphql';
import {
  markWebCardAsDeleted,
  getActiveWebCardSubscription,
  removeProfile,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { profileByWebCardIdAndUserIdLoader, webCardLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { updateMonthlySubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

type Mutation = MutationResolvers['quitWebCard'];

const quitWebCard: Mutation = async (_, params) => {
  const webCardId = fromGlobalIdWithType(params.webCardId, 'WebCard');

  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await profileByWebCardIdAndUserIdLoader.load({
    webCardId,
    userId,
  });

  if (!profile) {
    throw new GraphQLError(ERRORS.PROFILE_DONT_EXISTS);
  }

  const webCard = await webCardLoader.load(webCardId);
  if (profile?.profileRole === 'owner') {
    await transaction(async () => {
      const subscription = await getActiveWebCardSubscription(
        profile.webCardId,
      );

      if (subscription) {
        throw new GraphQLError(ERRORS.SUBSCRIPTION_IS_ACTIVE);
      }

      await markWebCardAsDeleted(profile.webCardId, userId);
    });
    if (webCard) {
      invalidateWebCard(webCard.userName);
    }
  } else {
    await transaction(async () => {
      await removeProfile(profile.id, userId);
      await updateMonthlySubscription(userId, profile.webCardId);
    });
  }

  return {
    webCardId: params.webCardId,
  };
};

export default quitWebCard;
