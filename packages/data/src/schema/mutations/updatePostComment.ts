import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { getUserProfileWithWebCardId, updatePostComment } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updatePostCommentMutation: MutationResolvers['updatePostComment'] =
  async (
    _,
    { input: { commentId: gqlCommentId, comment } },
    { auth, loaders },
  ) => {
    const { userId } = auth;
    const commentId = fromGlobalId(gqlCommentId).id;
    const postComment = await loaders.PostComment.load(commentId);
    const profile =
      postComment &&
      userId &&
      (await getUserProfileWithWebCardId(userId, postComment.webCardId));

    if (!postComment) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!profile || !isEditor(profile.profileRole) || profile.invited) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
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
