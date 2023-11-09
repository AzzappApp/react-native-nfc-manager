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
      try {
        console.warn('PostReaction', profileId, targetId);
        const reaction = await getPostReaction(profileId, targetId, trx);
        console.warn('PostReaction reaction', reaction);
        const removeReaction = reaction?.reactionKind === reactionKind;
        console.warn('PostReaction removeReaction', removeReaction);
        if (removeReaction) {
          console.warn('PostReaction deleting', removeReaction);
          await deletePostReaction(profileId, targetId, trx);
        } else {
          console.warn(
            'PostReaction inserting',
            profileId,
            targetId,
            reactionKind,
          );
          await insertPostReaction(profileId, targetId, reactionKind, trx);
        }
        console.warn('PostReaction Before updating PostTableCounter', targetId);
        await trx
          .update(PostTable)
          .set({
            //prettier-ignore
            counterReactions:removeReaction? sql`${PostTable.counterReactions} -  1`: sql`${PostTable.counterReactions} +  1`,
          })
          .where(eq(PostTable.id, targetId));
        console.warn('PostReaction After updating PostTableCounter', targetId);
        await trx
          .update(ProfileTable)
          .set({
            //prettier-ignore
            nbLikes: removeReaction? sql`${ProfileTable.nbLikes} - 1`: sql`${ProfileTable.nbLikes} + 1`,
          })
          .where(eq(ProfileTable.id, post.authorId));
        console.warn('PostReaction After updating ProfileTable', post.authorId);
        await trx
          .update(ProfileTable)
          .set({
            //prettier-ignore
            nbPostsLiked: removeReaction? sql`${ProfileTable.nbPostsLiked} - 1`: sql`${ProfileTable.nbPostsLiked} + 1`,
          })
          .where(eq(ProfileTable.id, profileId));
        console.warn('PostReaction After updating ProfileTable', profileId);
        console.warn('PostReaction before statistics');
        await updateStatistics(post.authorId, 'likes', !removeReaction, trx);
        console.warn('PostReaction adter statistics');
      } catch (error) {
        console.error('PostReaction inside error', error);
      }
    });
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { post };
};

export default togglePostReaction;
