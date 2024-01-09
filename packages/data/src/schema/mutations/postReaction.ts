import { eq, sql } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { PostTable, WebCardTable, db, updateStatistics } from '#domains';
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
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profileId = auth.profileId;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { id: targetId, type } = fromGlobalId(postId);
  const post = await loaders.Post.load(targetId);
  if (type !== 'Post' || !post) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(post.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!webCard.cardIsPublished) {
    throw new GraphQLError(ERRORS.UNPUBLISHED_WEB_CARD);
  }

  try {
    await db.transaction(async trx => {
      const reaction = await getPostReaction(profile.webCardId, targetId, trx);
      const removeReaction = reaction?.reactionKind === reactionKind;

      if (removeReaction) {
        await deletePostReaction(profile.webCardId, targetId, trx);
      } else {
        await insertPostReaction(
          profile.webCardId,
          targetId,
          reactionKind,
          trx,
        );
      }
      await trx
        .update(PostTable)
        .set({
          //prettier-ignore
          counterReactions:removeReaction? sql`GREATEST(${PostTable.counterReactions} - 1, 0)`: sql`${PostTable.counterReactions} +  1`,
        })
        .where(eq(PostTable.id, targetId));
      await trx
        .update(WebCardTable)
        .set({
          //prettier-ignore
          nbLikes: removeReaction? sql`GREATEST(${WebCardTable.nbLikes} - 1, 0)`: sql`${WebCardTable.nbLikes} + 1`,
        })
        .where(eq(WebCardTable.id, post.webCardId));
      await trx
        .update(WebCardTable)
        .set({
          //prettier-ignore
          nbPostsLiked: removeReaction? sql`GREATEST(${WebCardTable.nbPostsLiked} - 1, 0)`: sql`${WebCardTable.nbPostsLiked} + 1`,
        })
        .where(eq(WebCardTable.id, profile.webCardId));
      await updateStatistics(post.webCardId, 'likes', !removeReaction, trx);
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { post };
};

export default togglePostReaction;
