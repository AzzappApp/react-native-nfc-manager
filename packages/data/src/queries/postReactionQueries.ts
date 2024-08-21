import { eq, and, sql } from 'drizzle-orm';
import { db, transaction } from '../database';
import { PostReactionTable, PostTable, WebCardTable } from '../schema';
import { getPostById } from './postQueries';
import { updateStatistics } from './webCardStatisticQueries';
import type { PostReaction } from '../schema';

/**
 * Create a post reaction
 *
 * @param webCardId - The if of the web card reacting
 * @param postId - The id of the post being reacted
 * @param reactionKind - The kind of reaction
 */
export const createPostReaction = async (
  webCardId: string,
  postId: string,
  reactionKind: PostReaction['reactionKind'],
) => {
  await db().insert(PostReactionTable).values({
    webCardId,
    postId,
    reactionKind,
  });
};

/**
 * Delete a post reaction
 *
 * @param webCardId - The if of the web card reacting
 * @param postId - The id of the post being reacted
 * @param reactionKind - The kind of reaction
 */
export const deletePostReaction = async (
  webCardId: string,
  postId: string,
  reactionKind: PostReaction['reactionKind'],
) => {
  await db()
    .delete(PostReactionTable)
    .where(
      and(
        eq(PostReactionTable.webCardId, webCardId),
        eq(PostReactionTable.postId, postId),
        eq(PostReactionTable.reactionKind, reactionKind),
      ),
    );
};

/**
 * Retrieve a post reaction
 *
 * @param webCardId - The if of the web card reacting
 * @param postId - The id of the post being reacted
 * @param reactionKind - The kind of reaction
 */
export const getPostReaction = async (
  webCardId: string,
  postId: string,
  reactionKind: PostReaction['reactionKind'],
): Promise<PostReaction | null> =>
  db()
    .select()
    .from(PostReactionTable)
    .where(
      and(
        eq(PostReactionTable.webCardId, webCardId),
        eq(PostReactionTable.postId, postId),
        eq(PostReactionTable.reactionKind, reactionKind),
      ),
    )
    .then(res => res[0] ?? null);

/**
 * Toggle a post reaction on a post
 *
 * @param webCardId - The id of the web card reacting
 * @param postId - The id of the post being reacted
 * @param reactionKind - The kind of reaction
 * @returns true if the reaction was added, false if it was removed
 */
export const togglePostReaction = async (
  webCardId: string,
  postId: string,
  reactionKind: PostReaction['reactionKind'],
) =>
  transaction(async () => {
    const post = await getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    const reaction = await getPostReaction(webCardId, postId, reactionKind);
    const reactionExists = !!reaction;
    if (reactionExists) {
      await deletePostReaction(webCardId, postId, reactionKind);
    } else {
      await createPostReaction(webCardId, postId, reactionKind);
    }
    await db()
      .update(PostTable)
      .set({
        counterReactions: reactionExists
          ? sql`GREATEST(${PostTable.counterReactions} - 1, 0)`
          : sql`${PostTable.counterReactions} +  1`,
      })
      .where(eq(PostTable.id, postId));

    await db()
      .update(WebCardTable)
      .set({
        nbLikes: reactionExists
          ? sql`GREATEST(${WebCardTable.nbLikes} - 1, 0)`
          : sql`${WebCardTable.nbLikes} + 1`,
      })
      .where(eq(WebCardTable.id, post.webCardId));
    await db()
      .update(WebCardTable)
      .set({
        nbPostsLiked: reactionExists
          ? sql`GREATEST(${WebCardTable.nbPostsLiked} - 1, 0)`
          : sql`${WebCardTable.nbPostsLiked} + 1`,
      })
      .where(eq(WebCardTable.id, webCardId));
    await updateStatistics(post.webCardId, 'likes', !reactionExists);

    return !reactionExists;
  });
