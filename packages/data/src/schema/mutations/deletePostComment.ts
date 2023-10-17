import { eq, sql } from 'drizzle-orm';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { PostTable, db, getPostCommentById, removeComment } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const deletePostComment: MutationResolvers['deletePostComment'] = async (
  _,
  { input: { commentId } },
  { auth },
) => {
  const { profileId } = auth;

  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(commentId);
  if (type !== 'PostComment') {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  try {
    const originalComment = await getPostCommentById(targetId);
    if (!originalComment) throw new Error(ERRORS.INVALID_REQUEST);
    if (originalComment.profileId !== profileId)
      throw new Error(ERRORS.FORBIDDEN);

    await db.transaction(async trx => {
      await trx
        .update(PostTable)
        .set({
          counterComments: sql`${PostTable.counterComments} -  1`,
        })
        .where(eq(PostTable.id, originalComment.postId));

      await removeComment(targetId, trx);
    });

    return {
      commentId,
    };
  } catch (error) {
    console.error(error);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default deletePostComment;
