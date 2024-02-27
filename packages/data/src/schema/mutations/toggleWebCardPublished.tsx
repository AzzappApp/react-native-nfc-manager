import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import {
  getProfilesPosts,
  getUserProfileWithWebCardId,
  updateWebCard,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const toggleWebCardPublished: MutationResolvers['toggleWebCardPublished'] =
  async (
    _,
    { input: { webCardId: gqlWebCardId, published } },
    { auth, cardUsernamesToRevalidate, postsToRevalidate, loaders },
  ) => {
    const { userId } = auth;
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const profile =
      userId && (await getUserProfileWithWebCardId(userId, webCardId));

    if (!profile) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    if (!isAdmin(profile.profileRole)) {
      throw new GraphQLError(ERRORS.FORBIDDEN, {
        extensions: { role: profile.profileRole },
      });
    }

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
      await updateWebCard(profile.webCardId, updates);
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
