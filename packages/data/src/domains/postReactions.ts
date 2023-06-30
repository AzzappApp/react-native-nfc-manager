import { eq, and, sql } from 'drizzle-orm';
import {
  index,
  primaryKey,
  mysqlEnum,
  datetime,
  varchar,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
} from './db';
import { post } from './posts';
import type { InferModel } from 'drizzle-orm';

export const PostReactionTable = mysqlTable(
  'PostReaction',
  {
    profileId: varchar('profileId', {
      length: DEFAULT_VARCHAR_LENGTH,
    }).notNull(),
    postId: varchar('postId', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
    reactionKind: mysqlEnum('reactionKind', ['like']).notNull(),
    createdAt: datetime('createdAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
  },
  table => {
    return {
      postIdIdx: index('PostReaction_postId_idx').on(table.postId),
      profileIdIdx: index('PostReaction_profileId_idx').on(table.profileId),
      postReactionPostIdProfileId: primaryKey(table.postId, table.profileId),
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
      .update(post)
      .set({
        counterReactions: sql`${post.counterReactions} + 1`,
      })
      .where(eq(post.id, postId));
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
      .update(post)
      .set({
        counterReactions: sql`${post.counterReactions} - 1`,
      })
      .where(eq(post.id, postId));
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
