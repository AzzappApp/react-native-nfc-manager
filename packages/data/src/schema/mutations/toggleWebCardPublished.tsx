import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { getProfilesPosts, updateWebCard } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const toggleWebCardPublished: MutationResolvers['toggleWebCardPublished'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { published } },
    { cardUsernamesToRevalidate, postsToRevalidate, loaders },
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    const webCard = await loaders.WebCard.load(webCardId);
    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
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

    const posts = await getProfilesPosts(webCard.id);
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
