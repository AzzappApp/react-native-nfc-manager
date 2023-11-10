import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { getPostCommentById, updatePostComment } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updatePostCommentMutation: MutationResolvers['updatePostComment'] =
  async (_, { input: { commentId, comment } }, { auth }) => {
    const { profileId } = auth;

    if (!profileId) {
      throw new GraphQLError(ERRORS.UNAUTORIZED);
    }

    const { id: targetId, type } = fromGlobalId(commentId);
    if (type !== 'PostComment' || !comment) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    try {
      const originalComment = await getPostCommentById(targetId);
      if (!originalComment) throw new GraphQLError(ERRORS.INVALID_REQUEST);
      if (originalComment.profileId !== profileId)
        throw new GraphQLError(ERRORS.FORBIDDEN);

      await updatePostComment(targetId, comment);

      return {
        postComment: {
          ...originalComment,
          comment,
        },
      };
    } catch (error) {
      console.error(error);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

export default updatePostCommentMutation;
