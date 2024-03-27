import { eq, sql } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { PostTable, db, removeComment } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const deletePostComment: MutationResolvers['deletePostComment'] = async (
  _,
  { webCardId: gqlWebCardId, commentId: gqlCommentId },
  { loaders, auth },
) => {
  const commentId = fromGlobalId(gqlCommentId).id;
  const comment = await loaders.PostComment.load(commentId);
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const userId = auth.userId;
  if (comment?.webCardId !== webCardId || !userId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    const originalComment = await loaders.PostComment.load(commentId);
    if (!originalComment) throw new GraphQLError(ERRORS.INVALID_REQUEST);
    if (originalComment.webCardId !== webCardId)
      throw new GraphQLError(ERRORS.FORBIDDEN);

    await db.transaction(async trx => {
      await trx
        .update(PostTable)
        .set({
          counterComments: sql`${PostTable.counterComments} -  1`,
        })
        .where(eq(PostTable.id, originalComment.postId));

      await removeComment(commentId, userId, trx);
    });
    loaders.PostComment.clear(commentId);

    return {
      commentId: gqlCommentId,
    };
  } catch (error) {
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default deletePostComment;
