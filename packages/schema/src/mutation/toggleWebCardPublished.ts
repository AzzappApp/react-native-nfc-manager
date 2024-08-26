import { GraphQLError } from 'graphql';
import { getWebCardPosts, updateWebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidatePost, invalidateWebCard } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { webCardLoader } from '#loaders';
import { hasWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { checkWebCardHasSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const toggleWebCardPublished: MutationResolvers['toggleWebCardPublished'] =
  async (_, { webCardId: gqlWebCardId, input: { published } }) => {
    const { userId } = getSessionInfos();
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    if (!(await hasWebCardProfileAdminRight(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const webCard = await webCardLoader.load(webCardId);
    if (!webCard || !userId) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!webCard.coverMediaId && published) {
      throw new GraphQLError(ERRORS.MISSING_COVER);
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

    invalidateWebCard(webCard.userName);

    const posts = await getWebCardPosts(webCard.id);
    posts.forEach(post => invalidatePost(webCard.userName, post.id));

    return {
      webCard: {
        ...webCard,
        ...updates,
      },
    };
  };

export default toggleWebCardPublished;
