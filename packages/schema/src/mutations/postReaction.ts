import { GraphQLError } from 'graphql';
import { togglePostReaction } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const togglePostReactionMutation: MutationResolvers['togglePostReaction'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { postId: gqlPostId, reactionKind } },
    { loaders },
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    const postId = fromGlobalIdWithType(gqlPostId, 'Post');
    const post = await loaders.Post.load(postId);
    if (!post || post.deleted) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const webCard = await loaders.WebCard.load(post.webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!webCard.cardIsPublished) {
      throw new GraphQLError(ERRORS.UNPUBLISHED_WEB_CARD);
    }

    try {
      const reactionAdded = await togglePostReaction(
        webCardId,
        postId,
        reactionKind,
      );
      return {
        post: {
          ...post,
          counterReactions: reactionAdded
            ? post.counterReactions + 1
            : post.counterReactions - 1,
        },
      };
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

export default togglePostReactionMutation;
