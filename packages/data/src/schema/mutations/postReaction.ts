import { eq, sql } from 'drizzle-orm';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { PostTable, ProfileTable, db } from '#domains';
import {
  deletePostReaction,
  getPostReaction,
  insertPostReaction,
} from '#domains/postReactions';
import type { MutationResolvers } from '#schema/__generated__/types';

const togglePostReaction: MutationResolvers['togglePostReaction'] = async (
  _,
  { input: { postId, reactionKind } },
  { auth, loaders },
) => {
  if (!auth.userId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const profileId = auth.profileId;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(postId);
  const post = await loaders.Post.load(targetId);
  if (type !== 'Post' || !post) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    db.transaction(async trx => {
      const reaction = await getPostReaction(profileId, targetId);
      const removeReaction = reaction?.reactionKind === reactionKind;

      await Promise.all([
        removeReaction
          ? deletePostReaction(profileId, targetId, trx)
          : insertPostReaction(profileId, targetId, reactionKind, trx),
        trx
          .update(PostTable)
          .set({
            //prettier-ignore
            counterReactions: sql`${PostTable.counterReactions} ${removeReaction ? '-' : '+'} 1`,
          })
          .where(eq(PostTable.id, targetId)),
        reactionKind === 'like' &&
          trx
            .update(ProfileTable)
            .set({
              //prettier-ignore
              nbLikes: sql`${PostTable.counterReactions} ${removeReaction ? '-' : '+'} 1`,
            })
            .where(eq(ProfileTable.id, post.authorId)),
      ]);
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { post };
};

export default togglePostReaction;
