import { eq, sql } from 'drizzle-orm';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { PostTable, ProfileTable, db, updateStatistics } from '#domains';
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
      console.warn('PostReaction', profileId, targetId);
      const reaction = await getPostReaction(profileId, targetId, trx);
      console.warn('PostReaction reaction', reaction);
      const removeReaction = reaction?.reactionKind === reactionKind;

      if (removeReaction) {
        await deletePostReaction(profileId, targetId, trx);
      } else {
        await insertPostReaction(profileId, targetId, reactionKind, trx);
      }

      await trx
        .update(PostTable)
        .set({
          //prettier-ignore
          counterReactions:removeReaction? sql`${PostTable.counterReactions} -  1`: sql`${PostTable.counterReactions} +  1`,
        })
        .where(eq(PostTable.id, targetId));

      await trx
        .update(ProfileTable)
        .set({
          //prettier-ignore
          nbLikes: removeReaction? sql`${ProfileTable.nbLikes} - 1`: sql`${ProfileTable.nbLikes} + 1`,
        })
        .where(eq(ProfileTable.id, post.authorId));

      await trx
        .update(ProfileTable)
        .set({
          //prettier-ignore
          nbPostsLiked: removeReaction? sql`${ProfileTable.nbPostsLiked} - 1`: sql`${ProfileTable.nbPostsLiked} + 1`,
        })
        .where(eq(ProfileTable.id, profileId));
      console.warn('PostReaction before statistics');
      await updateStatistics(post.authorId, 'likes', !removeReaction, trx);
      console.warn('PostReaction adter statistics');
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { post };
};

export default togglePostReaction;
