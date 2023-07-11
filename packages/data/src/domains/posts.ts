import { createId } from '@paralleldrive/cuid2';
import { eq, inArray, desc, sql, and, lt } from 'drizzle-orm';
import {
  json,
  text,
  int,
  datetime,
  index,
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
import { FollowTable } from './follows';
import { customTinyInt, sortEntitiesByIds } from './generic';
import { getTopPostsComment } from './postComments';
import type { DbTransaction } from './db';
import type { PostComment } from './postComments';
import type { Profile } from './profiles';
import type { InferModel } from 'drizzle-orm';

export const PostTable = mysqlTable(
  'Post',
  {
    id: varchar('id', { length: DEFAULT_VARCHAR_LENGTH })
      .primaryKey()
      .notNull(),
    authorId: varchar('authorId', { length: DEFAULT_VARCHAR_LENGTH }).notNull(),
    content: text('content'),
    allowComments: customTinyInt('allowComments').notNull(),
    allowLikes: customTinyInt('allowLikes').notNull(),
    createdAt: datetime('createdAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
    updatedAt: datetime('updatedAt', {
      mode: 'date',
      fsp: DEFAULT_DATETIME_PRECISION,
    })
      .default(DEFAULT_DATETIME_VALUE)
      .notNull(),
    medias: json('medias').notNull(),
    counterReactions: int('counterReactions').default(0).notNull(),
    counterComments: int('counterComments').default(0).notNull(),
  },
  table => {
    return {
      authorIdIdx: index('Post_authorId_idx').on(table.authorId),
    };
  },
);

export type Post = InferModel<typeof PostTable>;
export type NewPost = Omit<InferModel<typeof PostTable, 'insert'>, 'id'>;
export type PostWithCommentAndAuthor = Post & {
  comment: (PostComment & { author: Profile }) | null;
};

/**
 * Retrieve a list of post by their ids.
 * @param ids - The ids of the post to retrieve
 * @returns A list of post, where the order of the post matches the order of the ids
 */
export const getPostsByIds = async (ids: readonly string[]) =>
  sortEntitiesByIds(
    ids,
    await db
      .select()
      .from(PostTable)
      .where(inArray(PostTable.id, ids as string[])),
  );

/**
 * Retrieve a profile's post, ordered by date, with pagination.
 *
 * @param profileId  The id of the profile
 * @param limit The maximum number of post to retrieve
 * @param offset The offset of the first post to retrieve
 * @returns A list of post
 */
export const getProfilesPosts = async (
  profileId: string,
  limit: number,
  offset: number,
) => {
  const res = await db
    .select()
    .from(PostTable)
    .where(eq(PostTable.authorId, profileId))
    .orderBy(desc(PostTable.createdAt))
    .limit(limit)
    .offset(offset);
  return res;
};

/**
 * Retrieve a profile's post, ordered by date, with pagination.
 *
 * @param profileId  The id of the profile
 * @param limit The maximum number of post to retrieve
 * @param offset The offset of the first post to retrieve
 * @returns A list of post
 */
export const getProfilesPostsWithTopComment = async (
  profileId: string,
  limit: number,
  offset: number,
) => {
  const posts = await db
    .select()
    .from(PostTable)
    .where(eq(PostTable.authorId, profileId))
    .orderBy(desc(PostTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (posts.length === 0) return [];

  const comments = await getTopPostsComment(posts.map(post => post.id));

  return posts.map(post => ({
    ...post,
    comment: comments.find(comment => comment.postId === post.id) ?? null,
  })) satisfies PostWithCommentAndAuthor[];
};

/**
 * Retrieve the number of post a profile has.
 * @param profileId - The id of the profile
 * @returns he number of post the profile has
 */
export const getProfilesPostsCount = (profileId: string) =>
  db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(PostTable)
    .where(eq(PostTable.authorId, profileId))

    .then(res => res[0].count);

/**
 * Retrieve a list of all post, ordered by date, with pagination based on postDate.
 *
 * @param limit - The maximum number of post to retrieve
 * @param offset - the offset of the first post to retrieve (based on postDate)
 * @returns A list of post
 */
export const getAllPosts = async (limit: number, after: Date | null = null) => {
  return db
    .select()
    .from(PostTable)
    .where(after ? lt(PostTable.createdAt, after) : undefined)
    .orderBy(desc(PostTable.createdAt))
    .limit(limit);
};

/**
 * Retrieve a list of post from the profiles a profile is following, ordered by date,
 * with pagination based on postDate.
 *
 * @param profileId - The id of the profile
 * @param limit - The maximum number of post to retrieve
 * @param offset - the offset of the first post to retrieve (based on postDate)
 * @returns A list of post
 */
export const getFollowingsPosts = async (
  profileId: string,
  limit: number,
  after: Date | null = null,
) => {
  return db
    .select({
      Post: PostTable,
    })
    .from(PostTable)
    .innerJoin(FollowTable, eq(PostTable.authorId, FollowTable.followingId))
    .where(
      and(
        eq(FollowTable.followerId, profileId),
        after ? lt(PostTable.createdAt, after) : undefined,
      ),
    )
    .orderBy(desc(PostTable.createdAt))
    .limit(limit)

    .then(res => res.map(({ Post }) => Post));
};

/**
 * Retrieve the number of post from the profiles a profile is following.
 *
 * @param profileId - The id of the profile
 * @returns The number of post from the profiles a profile is following
 */
export const getFollowingsPostsCount = async (profileId: string) =>
  db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(PostTable)
    .innerJoin(FollowTable, eq(PostTable.authorId, FollowTable.followingId))
    .where(eq(FollowTable.followerId, profileId))

    .then(res => res[0].count);

/**
 * Create a post.
 *
 * @param values - the post fields, excluding the id and the postDate
 * @param tx - The query creator to use (profile for transactions)
 * @returns The created post
 */
export const createPost = async (values: NewPost, tx: DbTransaction = db) => {
  const addedPost = {
    ...values,
    id: createId(),
  };
  await tx.insert(PostTable).values(addedPost);
  // TODO should we return the post from the database instead? createdAt might be different
  return {
    ...addedPost,
    content: addedPost.content ?? null,
    counterReactions: 0,
    counterComments: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * update the post
 *
 * @param {string} postId
 * @param {(Partial<Omit<Post, 'createdAt' | 'id'>>)} data
 * @return {*}  {Promise<Partial<Post>>}
 */
export const updatePost = async (
  postId: string,
  data: Partial<Omit<Post, 'createdAt' | 'id' | 'media'>>,
) => {
  await db
    .update(PostTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(PostTable.id, postId));
};
