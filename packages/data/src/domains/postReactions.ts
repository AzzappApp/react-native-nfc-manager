import db from './db';
import type { PostReaction, ReactionKind } from '#domains';

/**
 * insert a post reaction
 *
 * @param {string} profileId
 * @param {string} postId
 * @param {ReactionKind} reactionKind
 * @return {*}  {Promise<void>}
 */
export const insertPostReaction = async (
  profileId: string,
  postId: string,
  reactionKind: ReactionKind,
): Promise<void> =>
  db.transaction().execute(async trx => {
    await trx
      .insertInto('PostReaction')
      .values({
        profileId,
        postId,
        reactionKind,
      })
      .execute();

    await trx
      .updateTable('Post')
      .where('id', '=', postId)
      .set(eb => ({
        counterReactions: eb.bxp('counterReactions', '+', 1),
      }))
      .execute();
  });

/**
 * delete a post reaction
 *
 * @param {string} profileId
 * @param {string} postId
 * @return {*}  {Promise<void>}
 */
export const deletePostReaction = async (
  profileId: string,
  postId: string,
): Promise<void> =>
  db.transaction().execute(async trx => {
    await trx
      .deleteFrom('PostReaction')
      .where('profileId', '=', profileId)
      .where('postId', '=', postId)
      .execute();

    await trx
      .updateTable('Post')
      .where('id', '=', postId)
      .set(eb => ({
        counterReactions: eb.bxp('counterReactions', '-', 1),
      }))
      .execute();
  });

/**
 * get a post reaction
 *
 * @param {string} profileId
 * @param {string} postId
 * @return {*}  {(Promise<PostReaction | null>)}
 */
export const getPostReaction = async (
  profileId: string,
  postId: string,
): Promise<PostReaction | null> => {
  const res = await db
    .selectFrom('PostReaction')
    .selectAll()
    .where('profileId', '=', profileId)
    .where('postId', '=', postId)
    .executeTakeFirst();
  return res ?? null;
};
