import { GraphQLError } from 'graphql';
import { getPostReaction, togglePostReaction } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { postLoader, webCardLoader } from '#loaders';
import {
  checkWebCardHasCover,
  checkWebCardProfileEditorRight,
} from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const togglePostReactionMutation: MutationResolvers['togglePostReaction'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { postId: gqlPostId, reactionKind } },
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    await checkWebCardProfileEditorRight(webCardId);
    await checkWebCardHasCover(webCardId);

    const postId = fromGlobalIdWithType(gqlPostId, 'Post');
    const post = await postLoader.load(postId);
    if (!post || post.deleted) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (reactionKind === 'like' && !post.allowLikes) {
      throw new GraphQLError(ERRORS.REACTION_NOT_ALLOWED);
    }

    const webCard = await webCardLoader.load(post.webCardId);

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

      let postReaction = await getPostReaction(webCardId, postId, reactionKind);
      let attempt = 1;
      while (
        ((reactionAdded && !postReaction) ||
          (!reactionAdded && postReaction)) &&
        attempt < 20
      ) {
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
        postReaction = await getPostReaction(webCardId, postId, reactionKind);
        attempt++;
      }

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
