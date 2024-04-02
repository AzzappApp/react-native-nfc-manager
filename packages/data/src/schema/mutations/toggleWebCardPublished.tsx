import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { webcardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import { getWebCardPosts, updateWebCard, getCardModules } from '#domains';
import { activeUserSubscription } from '#domains/userSubscriptions';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

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

    const modules = await getCardModules(webCardId);

    if (webcardRequiresSubscription(modules, webCard.webCardKind)) {
      const subscription = await activeUserSubscription(userId);
      if (!subscription || subscription.length === 0)
        throw new GraphQLError(ERRORS.UNAUTHORIZED);
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
