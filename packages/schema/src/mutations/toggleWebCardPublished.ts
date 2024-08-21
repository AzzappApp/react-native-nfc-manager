import { GraphQLError } from 'graphql';
import { getWebCardPosts, updateWebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { checkWebCardHasSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const toggleWebCardPublished: MutationResolvers['toggleWebCardPublished'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { published } },
    { auth, cardUsernamesToRevalidate, postsToRevalidate, loaders },
  ) => {
    const { userId } = auth;
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    const webCard = await loaders.WebCard.load(webCardId);
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

    await checkWebCardHasSubscription(
      { webCard: { ...webCard, ...updates } },
      loaders,
    );

    try {
      await updateWebCard(webCardId, updates);
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    cardUsernamesToRevalidate.add(webCard.userName);

    const posts = await getWebCardPosts(webCard.id);
    posts.forEach(post =>
      postsToRevalidate.add({ id: post.id, userName: webCard.userName }),
    );

    return {
      webCard: {
        ...webCard,
        ...updates,
      },
    };
  };

export default toggleWebCardPublished;
