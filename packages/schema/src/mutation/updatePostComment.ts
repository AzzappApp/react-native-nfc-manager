import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { updatePostComment } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { postCommentLoader } from '#loaders';
import { hasWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const updatePostCommentMutation: MutationResolvers['updatePostComment'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { commentId: gqlCommentId, comment } },
  ) => {
    const commentId = fromGlobalId(gqlCommentId).id;
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    if (!(await hasWebCardProfileEditorRight(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const postComment = await postCommentLoader.load(commentId);

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
