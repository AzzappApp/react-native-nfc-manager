import { GraphQLError } from 'graphql';
import {
  getWebCardCountProfile,
  getWebCardPosts,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidatePost, invalidateWebCard } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { webCardLoader, webCardOwnerLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
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
    if (published && webCard.isMultiUser) {
      const owner = await webCardOwnerLoader.load(webCardId);
      //we first need to heck if this is an IAP subscription and enought seath
      if (owner?.id) {
        await validateCurrentSubscription(
          owner.id,
          await getWebCardCountProfile(webCardId),
        );
      }
    }

    const updates = {
      cardIsPublished: published,
      alreadyPublished: webCard.alreadyPublished || published,
      updatedAt: new Date(),
      lastCardUpdate: new Date(),
    };

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
