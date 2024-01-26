import { eq, sql } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import {
  PostTable,
  db,
  getPostCommentById,
  getUserProfileWithWebCardId,
  removeComment,
} from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const deletePostComment: MutationResolvers['deletePostComment'] = async (
  _,
  { input: { commentId: gqlCommentId } },
  { auth, loaders },
) => {
  const { userId } = auth;
  const commentId = fromGlobalId(gqlCommentId).id;
  const comment = await loaders.PostComment.load(commentId);
  const profile =
    comment &&
    userId &&
    (await getUserProfileWithWebCardId(userId, comment.webCardId));

  if (!profile || !isEditor(profile.profileRole) || profile.invited) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { id: targetId, type } = fromGlobalId(commentId);
  if (type !== 'PostComment') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  try {
    const originalComment = await getPostCommentById(targetId);
    if (!originalComment) throw new GraphQLError(ERRORS.INVALID_REQUEST);
    if (originalComment.webCardId !== profile.webCardId)
      throw new GraphQLError(ERRORS.FORBIDDEN);

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
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default deletePostComment;
