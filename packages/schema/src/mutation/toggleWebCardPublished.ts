import { GraphQLError } from 'graphql';
import {
  getActiveUserSubscriptions,
  getTotalMultiUser,
  getWebCardPosts,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { extractSeatsFromIAPSubscriptionId } from '@azzapp/shared/subscriptionHelpers';
import { invalidatePost, invalidateWebCard } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { checkWebCardHasSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const toggleWebCardPublished: MutationResolvers['toggleWebCardPublished'] =
  async (_, { webCardId: gqlWebCardId, input: { published } }) => {
    const { userId } = getSessionInfos();
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    await checkWebCardProfileAdminRight(webCardId);

    const webCard = await webCardLoader.load(webCardId);
    if (!webCard || !userId) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!webCard.coverMediaId && published) {
      throw new GraphQLError(ERRORS.MISSING_COVER);
    }

    //checking if there is enough seats for the user
    const userSubscription = await getActiveUserSubscriptions([userId]);
    if (!published && userSubscription.length > 0) {
      //user can only have ONE usersubscription at a time
      const subscription = userSubscription[0];
      if (subscription && subscription.subscriptionId) {
        const totalUsedSeats = await getTotalMultiUser(userId);
        const totalSeats = extractSeatsFromIAPSubscriptionId(
          subscription.subscriptionId,
        );
        if (totalSeats - totalUsedSeats < 0) {
          //TODO ? be sure the webcard are unpublished (not sure other process should already do it)
          throw new GraphQLError(ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS);
        }
      }
    }

    const updates = {
      cardIsPublished: published,
      alreadyPublished: webCard.alreadyPublished || published,
      updatedAt: new Date(),
      lastCardUpdate: new Date(),
    };

    await checkWebCardHasSubscription({ webCard: { ...webCard, ...updates } });

    try {
      await updateWebCard(webCardId, updates);
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    if (webCard.userName) {
      invalidateWebCard(webCard.userName);
      const posts = await getWebCardPosts(webCard.id);
      posts.forEach(
        post => webCard.userName && invalidatePost(webCard.userName, post.id),
      );
    }
    return {
      webCard: {
        ...webCard,
        ...updates,
      },
    };
  };

export default toggleWebCardPublished;
