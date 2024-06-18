import { GraphQLError } from 'graphql';
import { getWebCardPosts, updateWebCard, getCardModules } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
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

    const modules = await getCardModules(webCardId);

    const owner = await loaders.webCardOwners.load(webCard.id);

    if (
      webCardRequiresSubscription(modules, webCard.webCardKind) &&
      published
    ) {
      const subscription = owner
        ? await loaders.activeSubscriptionsLoader.load(owner.id)
        : [];
      if (subscription.length === 0) {
        throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
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
