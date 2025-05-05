import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { removeComment } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import { postCommentLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const deletePostComment: MutationResolvers['deletePostComment'] = async (
  _,
  { webCardId: gqlWebCardId, commentId: gqlCommentId },
) => {
  const commentId = fromGlobalId(gqlCommentId).id;
  const comment = await postCommentLoader.load(commentId);
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  if (comment?.webCardId !== webCardId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await checkWebCardProfileEditorRight(webCardId);

  try {
    const originalComment = await postCommentLoader.load(commentId);
    if (originalComment?.webCardId !== webCardId) {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }

    await removeComment(commentId, originalComment.postId, user.id);
    postCommentLoader.clear(commentId);

    return {
      commentId: gqlCommentId,
    };
  } catch (error) {
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default deletePostComment;
