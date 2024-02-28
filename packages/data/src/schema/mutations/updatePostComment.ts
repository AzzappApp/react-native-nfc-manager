import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { updatePostComment } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const updatePostCommentMutation: MutationResolvers['updatePostComment'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { commentId: gqlCommentId, comment } },
    { loaders },
  ) => {
    const commentId = fromGlobalId(gqlCommentId).id;
    const postComment = await loaders.PostComment.load(commentId);

    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    if (!postComment || postComment.webCardId !== webCardId) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    try {
      await updatePostComment(commentId, comment);

      return {
        postComment: {
          ...postComment,
          comment,
        },
      };
    } catch (error) {
      console.error(error);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

export default updatePostCommentMutation;
