import { createId } from '@paralleldrive/cuid2';
import { eq, sql, and, desc, inArray } from 'drizzle-orm';
import {
  text,
  index,
  datetime,
  varchar,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
} from 'drizzle-orm/mysql-core';
import { CardCoverTable } from './cardCovers';
import { CardTable } from './cards';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
} from './db';
import { sortEntitiesByIds } from './generic';
import { MediaTable } from './medias';
import { PostTable } from './posts';
import { ProfileTable } from './profiles';
import type { Media } from './medias';
import type { Profile } from './profiles';
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
export type PostCommentWithProfile = Pick<Profile, 'firstName' | 'lastName'> &
  PostComment & { media: Media };

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
) =>
  db.transaction(async trx => {
    const id = createId();
    const addedPostComment = {
      id,
      profileId,
      postId,
      comment,
    };
    await trx.insert(PostCommentTable).values(addedPostComment);

    await trx
      .update(PostTable)
      .set({
        counterComments: sql`${PostTable.counterComments} + 1`,
      })
      .where(eq(PostTable.id, postId));

    return { ...addedPostComment, createdAt: new Date() };
  });

/**
 * Retrieves posts comments ordered by date
 * @param limit - The maximum number of comments to retrieve
 * @param before - The maximum date of creation for the comments to retrieve
 * @returns A list of PostComment
 */
export const getPostCommentsWithProfile = async (
  postId: string,
  limit: number,
  before?: Date,
) => {
  const res = await db
    .select()
    .from(PostCommentTable)
    .where(
      and(
        eq(PostCommentTable.postId, postId),
        before ? sql`${PostCommentTable.createdAt} < ${before}` : undefined,
      ),
    )
    .innerJoin(ProfileTable, eq(ProfileTable.id, PostCommentTable.profileId))
    .innerJoin(CardTable, eq(CardTable.profileId, ProfileTable.id))
    .innerJoin(CardCoverTable, eq(CardCoverTable.id, CardTable.coverId))
    .innerJoin(MediaTable, eq(MediaTable.id, CardCoverTable.mediaId))
    .orderBy(desc(PostCommentTable.createdAt))
    .limit(limit);

  return res.map(({ PostComment, Profile, Media }) => ({
    ...PostComment,
    firstName: Profile.firstName,
    lastName: Profile.lastName,
    media: Media,
  })) satisfies PostCommentWithProfile[];
};

/**
 * Retrieves posts comments ordered by createdAt date
 * @param postId - The id of the post to retrieve comments for
 * @param limit - The maximum number of comments to retrieve
 * @param after - The date to fetch comments after
 * @returns A list of PostComment
 */
export const getPostCommentsByDate = async (
  postId: string,
  limit: number,
  after: Date | null = null,
) => {
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
    .limit(limit);
};

/**
 * Retrieves posts comments ordered by createdAt date
 * @param limit - The maximum number of profiles to retrieve
 * @param offset - The number of profiles to skip
 * @returns A list of PostComment
 */
export const getTopPostsComment = async (postId: string[]) => {
  const comments = await db
    .select({
      postsId: PostCommentTable.postId,
      createdAt: sql<string>`max(createdAt)`,
    })
    .from(PostCommentTable)
    .where(inArray(PostCommentTable.postId, postId))
    .groupBy(PostCommentTable.postId);

  if (comments.length === 0) return [];

  return db
    .select()
    .from(PostCommentTable)
    .where(
      inArray(
        PostCommentTable.postId,
        comments.map(comment => comment.postsId),
      ),
    )
    .innerJoin(ProfileTable, eq(PostCommentTable.profileId, ProfileTable.id))
    .then(res =>
      res.map(({ PostComment, Profile }) => ({
        ...PostComment,
        author: Profile,
      })),
    );
};

/**
 * Retrieve a list of post comments by their ids.
 * @param ids - The ids of the comments to retrieve
 * @returns A list of comments, where the order of the posts matches the order of the ids
 */
export const getPostCommentsByIds = async (ids: readonly string[]) =>
  sortEntitiesByIds(
    ids,
    await db
      .select()
      .from(PostCommentTable)
      .where(inArray(PostCommentTable.id, ids as string[])),
  );
