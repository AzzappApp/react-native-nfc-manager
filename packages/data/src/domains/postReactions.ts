import { eq, and } from 'drizzle-orm';
import {
  index,
  primaryKey,
  mysqlEnum,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';
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
  trx: DbTransaction = db,
) =>
  trx.insert(PostReactionTable).values({
    profileId,
    postId,
    reactionKind,
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
  trx: DbTransaction = db,
) =>
  trx
    .delete(PostReactionTable)
    .where(
      and(
        eq(PostReactionTable.profileId, profileId),
        eq(PostReactionTable.postId, postId),
      ),
    );

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
