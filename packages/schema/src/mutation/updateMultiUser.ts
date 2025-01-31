import { GraphQLError } from 'graphql';
import {
  activeUserSubscription,
  getTotalMultiUser,
  removeWebCardNonOwnerProfiles,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { extractSeatsFromIAPSubscriptionId } from '@azzapp/shared/subscriptionHelpers';
import { invalidateWebCard } from '#externals';
import {
  activeSubscriptionsForWebCardLoader,
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
    //we first need to heck if this is an IAP subscription and enought seath
    if (owner?.id) {
      const userSubscription = await activeUserSubscription([owner?.id]);
      if (userSubscription.length > 0) {
        //user can only have ONE usersubscription at a time
        const subscription = userSubscription[0];
        if (subscription && subscription.subscriptionId) {
          const totalUsedSeats = await getTotalMultiUser(owner?.id);
          const totalSeats = extractSeatsFromIAPSubscriptionId(
            subscription.subscriptionId,
          );
          if (totalSeats - totalUsedSeats < 0) {
            throw new GraphQLError(ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS);
          }
        }
      }
    }
    //then check if there is a subscription for this webcard
    const subscription = owner
      ? await activeSubscriptionsForWebCardLoader.load({
          userId: owner?.id ?? '',
          webCardId,
        })
      : null;

    if (!subscription) {
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
