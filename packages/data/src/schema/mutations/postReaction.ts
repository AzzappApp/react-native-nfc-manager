import { eq, sql } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { PostTable, WebCardTable, db, updateStatistics } from '#domains';
import {
  deletePostReaction,
  getPostReaction,
  insertPostReaction,
} from '#domains/postReactions';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const togglePostReaction: MutationResolvers['togglePostReaction'] = async (
  _,
  { webCardId: gqlWebCardId, input: { postId: gqlPostId, reactionKind } },
  { loaders },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const postId = fromGlobalIdWithType(gqlPostId, 'Post');
  const post = await loaders.Post.load(postId);
  if (!post || post.webCardId !== webCardId) {
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
    const updatedPost = await db.transaction(async trx => {
      const reaction = await getPostReaction(webCardId, postId, trx);
      const removeReaction = reaction?.reactionKind === reactionKind;
      if (removeReaction) {
        await deletePostReaction(webCardId, postId, trx);
      } else {
        await insertPostReaction(webCardId, postId, reactionKind, trx);
      }
      await trx
        .update(PostTable)
        .set({
          //prettier-ignore
          counterReactions:removeReaction? sql`GREATEST(${PostTable.counterReactions} - 1, 0)`: sql`${PostTable.counterReactions} +  1`,
        })
        .where(eq(PostTable.id, postId));

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
        .where(eq(WebCardTable.id, webCardId));
      await updateStatistics(post.webCardId, 'likes', !removeReaction, trx);

      return {
        ...post,
        counterReactions: removeReaction
          ? post.counterReactions - 1
          : post.counterReactions + 1,
      };
    });
    return { post: updatedPost };
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default togglePostReaction;
