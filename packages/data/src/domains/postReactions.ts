import { eq, and, sql } from 'drizzle-orm';
import {
  index,
  primaryKey,
  mysqlEnum,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import { PostTable } from './posts';
import type { InferModel } from 'drizzle-orm';

export const PostReactionTable = mysqlTable(
  'PostReaction',
  {
    profileId: cols.cuid('profileId').notNull(),
    postId: cols.cuid('postId').notNull(),
    reactionKind: mysqlEnum('reactionKind', ['like']).notNull(),
    createdAt: cols.dateTime('createdAt', true).notNull(),
  },
  table => {
    return {
      // TODO : not sure about this one : do we want to support several reactions on the same post (like and dislike) ?
      // We could imagine to user the last one but do we need to keep an historic of reactions ?
      postReactionPostIdReactionKindProfileId: primaryKey(
        table.postId,
        table.profileId,
        table.reactionKind,
      ),
      postIdIdx: index('PostReaction_postId_idx').on(table.postId),
      profileIdIdx: index('PostReaction_profileId_idx').on(table.profileId),
    };
  },
);

export type PostReaction = InferModel<typeof PostReactionTable>;
export type NewPostReaction = InferModel<typeof PostReactionTable, 'insert'>;

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
  reactionKind: PostReaction['reactionKind'],
) =>
  db.transaction(async trx => {
    await trx.insert(PostReactionTable).values({
      profileId,
      postId,
      reactionKind,
    });

    await trx
      .update(PostTable)
      .set({
        counterReactions: sql`${PostTable.counterReactions} + 1`,
      })
      .where(eq(PostTable.id, postId));
  });

/**
 * delete a post reaction
 *
 * @param {string} profileId
 * @param {string} postId
 * @return {*}  {Promise<void>}
 */
export const deletePostReaction = async (profileId: string, postId: string) =>
  db.transaction(async trx => {
    await trx
      .delete(PostReactionTable)
      .where(
        and(
          eq(PostReactionTable.profileId, profileId),
          eq(PostReactionTable.postId, postId),
        ),
      );

    await trx
      .update(PostTable)
      .set({
        counterReactions: sql`${PostTable.counterReactions} - 1`,
      })
      .where(eq(PostTable.id, postId));
  });

/**
 * get a post reaction
 *
 * @param {string} profileId
 * @param {string} postId
 * @return {*}  {(Promise<PostReaction | null>)}
 */
export const getPostReaction = async (profileId: string, postId: string) =>
  db
    .select()
    .from(PostReactionTable)
    .where(
      and(
        eq(PostReactionTable.profileId, profileId),
        eq(PostReactionTable.postId, postId),
      ),
    )

    .then(res => res.pop() ?? null);
