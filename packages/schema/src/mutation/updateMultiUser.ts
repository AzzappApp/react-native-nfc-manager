import { GraphQLError } from 'graphql';
import {
  getTotalMultiUser,
  removeWebCardNonOwnerProfiles,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import {
  activeSubscriptionsForUserLoader,
  webCardLoader,
  webCardOwnerLoader,
} from '#loaders';
import { checkWebCardOwnerProfile } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const updateMultiUser: MutationResolvers['updateMultiUser'] = async (
  _,
  { webCardId: gqlWebCardId, input: { isMultiUser } },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  await checkWebCardOwnerProfile(webCardId);
  const updates: Partial<WebCard> = {
    isMultiUser,
  };

  if (isMultiUser) {
    const owner = await webCardOwnerLoader.load(webCardId);
    const subscriptions = owner
      ? await activeSubscriptionsForUserLoader.load(owner?.id ?? '')
      : null;
    //we first need to heck if this is an IAP subscription and enought seath
    if (owner?.id) {
      if (subscriptions && subscriptions.length > 0) {
        //user can only have ONE usersubscription at a time
        const subscription = subscriptions[0];
        if (subscription && subscription.subscriptionId) {
          const totalUsedSeats = await getTotalMultiUser(owner?.id);
          const totalSeats = subscription.totalSeats;

          if (totalSeats - totalUsedSeats < 0) {
            throw new GraphQLError(ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS);
          }
        }
      }
    }

    if (!subscriptions || subscriptions.length === 0) {
      throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
    }
  }

  try {
    await transaction(async () => {
      await updateWebCard(webCardId, updates);
      if (!isMultiUser) {
        await removeWebCardNonOwnerProfiles(webCardId);
      }
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  const webCard = await webCardLoader.load(webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (webCard.userName) {
    invalidateWebCard(webCard.userName);
  }
  return {
    webCard,
  };
};

export default updateMultiUser;
