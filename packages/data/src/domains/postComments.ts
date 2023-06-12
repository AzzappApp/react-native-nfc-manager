import { createId } from '@paralleldrive/cuid2';
import { eq, sql, and, desc, inArray } from 'drizzle-orm';
import { text, index, datetime, varchar } from 'drizzle-orm/mysql-core';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
  mysqlTable,
} from './db';
import { post } from './posts';
import type { InferModel } from 'drizzle-orm';

export const PostCommentTable = mysqlTable(
  'PostComment',
  {
    id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH })
      .primaryKey()
      .notNull(),
    profileId: varchar('profileId', {
      length: DEFAULT_VARCHAR_LENGTH,
    }).notNull(),
    postId: varchar('postId', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
    comment: text('comment').notNull(),
    createdAt: datetime('createdAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
  },
  table => {
    return {
      postIdIdx: index('PostComment_postId_idx').on(table.postId),
    };
  },
);

export type PostComment = InferModel<typeof PostCommentTable>;
export type NewPostComment = InferModel<typeof PostCommentTable, 'insert'>;

/**
 * insert a post reaction
 *
 * @param {string} profileId
 * @param {string} comment
 * @param {string} postId
 * @return {*}  {Promise<void>}
 */
export const insertPostComment = async (
  profileId: string,
  postId: string,
  comment: string,
): Promise<PostComment> =>
  db.transaction(async trx => {
    const id = createId();
    const addedPostComment = {
      id,
      profileId,
      postId,
      comment,
    };
    await trx.insert(PostCommentTable).values(addedPostComment).execute();

    await trx
      .update(post)
      .set({
        counterComments: sql`${post.counterComments} + 1`,
      })
      .where(eq(post.id, postId))
      .execute();

    return { ...addedPostComment, createdAt: new Date() };
  });

/**
 * Retrieves posts comments ordered by createdAt date
 * @param limit - The maximum number of profiles to retrieve
 * @param offset - The number of profiles to skip
 * @returns A list of PostComment
 */
export const getPostComments = async (
  postId: string,
  limit: number,
  after: Date | null = null,
): Promise<PostComment[]> => {
  return db
    .select()
    .from(PostCommentTable)
    .where(
      and(
        eq(PostCommentTable.postId, postId),
        after ? sql`${PostCommentTable.createdAt} < ${after}` : undefined,
      ),
    )
    .orderBy(desc(PostCommentTable.createdAt))
    .limit(limit)
    .execute();
};

/**
 * Retrieve a list of post comments by their ids.
 * @param ids - The ids of the comments to retrieve
 * @returns A list of comments, where the order of the posts matches the order of the ids
 */
export const getPostCommentsByIds = (ids: string[]): Promise<PostComment[]> =>
  db
    .select()
    .from(PostCommentTable)
    .where(inArray(PostCommentTable.id, ids))
    .execute();
