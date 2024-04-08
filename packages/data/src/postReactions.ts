import { eq, and } from 'drizzle-orm';

import db, { DEFAULT_DATETIME_VALUE, cols } from './db';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const PostReactionTable = cols.table(
  'PostReaction',
  {
    webCardId: cols.cuid('webCardId').notNull(),
    postId: cols.cuid('postId').notNull(),
    reactionKind: cols.enum('reactionKind', ['like']).notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
  },
  table => {
    return {
      // TODO : not sure about this one : do we want to support several reactions on the same post (like and dislike) ?
      // We could imagine to user the last one but do we need to keep an historic of reactions ?
      postReactionPostIdReactionKindProfileId: cols.primaryKey({
        columns: [table.postId, table.webCardId, table.reactionKind],
      }),
      webCardIdKey: cols
        .index('PostReaction_webCardId_key')
        .on(table.webCardId),
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
