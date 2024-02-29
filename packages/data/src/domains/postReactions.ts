import { eq, and } from 'drizzle-orm';
import { primaryKey, mysqlEnum, mysqlTable } from 'drizzle-orm/mysql-core';
import db, { cols } from './db';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const PostReactionTable = mysqlTable(
  'PostReaction',
  {
    webCardId: cols.cuid('webCardId').notNull(),
    postId: cols.cuid('postId').notNull(),
    reactionKind: mysqlEnum('reactionKind', ['like']).notNull(),
    createdAt: cols.dateTime('createdAt').notNull(),
  },
  table => {
    return {
      // TODO : not sure about this one : do we want to support several reactions on the same post (like and dislike) ?
      // We could imagine to user the last one but do we need to keep an historic of reactions ?
      postReactionPostIdReactionKindProfileId: primaryKey({
        columns: [table.postId, table.reactionKind, table.webCardId],
      }),
    };
  },
);

export type PostReaction = InferSelectModel<typeof PostReactionTable>;
export type NewPostReaction = InferInsertModel<typeof PostReactionTable>;

/**
 * insert a post reaction
 *
 * @param {string} webCardId
 * @param {string} postId
 * @param {ReactionKind} reactionKind
 * @return {*}  {Promise<void>}
 */
export const insertPostReaction = async (
  webCardId: string,
  postId: string,
  reactionKind: PostReaction['reactionKind'],
  trx: DbTransaction = db,
) =>
  trx.insert(PostReactionTable).values({
    webCardId,
    postId,
    reactionKind,
  });

/**
 * delete a post reaction
 *
 * @param {string} webCardId
 * @param {string} postId
 * @return {*}  {Promise<void>}
 */
export const deletePostReaction = async (
  webCardId: string,
  postId: string,
  trx: DbTransaction = db,
) =>
  trx
    .delete(PostReactionTable)
    .where(
      and(
        eq(PostReactionTable.webCardId, webCardId),
        eq(PostReactionTable.postId, postId),
      ),
    );

/**
 * get a post reaction
 *
 * @param {string} webCardId
 * @param {string} postId
 * @return {*}  {(Promise<PostReaction | null>)}
 */
export const getPostReaction = async (
  webCardId: string,
  postId: string,
  trx: DbTransaction = db,
) =>
  trx
    .select()
    .from(PostReactionTable)
    .where(
      and(
        eq(PostReactionTable.webCardId, webCardId),
        eq(PostReactionTable.postId, postId),
      ),
    )

    .then(res => res.pop() ?? null);
