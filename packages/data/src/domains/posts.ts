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
import type { DbTransaction } from './db';
import type { InferModel } from 'drizzle-orm';

export const post = mysqlTable(
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

export type Post = InferModel<typeof post>;
export type NewPost = Omit<InferModel<typeof post, 'insert'>, 'id'>;

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
      .from(post)
      .where(inArray(post.id, ids as string[])),
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
    .from(post)
    .where(eq(post.authorId, profileId))
    .orderBy(desc(post.createdAt))
    .limit(limit)
    .offset(offset);
  return res;
};

/**
 * Retrieve the number of post a profile has.
 * @param profileId - The id of the profile
 * @returns he number of post the profile has
 */
export const getProfilesPostsCount = (profileId: string) =>
  db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(post)
    .where(eq(post.authorId, profileId))

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
    .from(post)
    .where(after ? lt(post.createdAt, after) : undefined)
    .orderBy(desc(post.createdAt))
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
export const getFollowedProfilesPosts = async (
  profileId: string,
  limit: number,
  after: Date | null = null,
) => {
  return db
    .select({
      Post: post,
    })
    .from(post)
    .innerJoin(FollowTable, eq(post.authorId, FollowTable.followingId))
    .where(
      and(
        eq(FollowTable.followerId, profileId),
        after ? lt(post.createdAt, after) : undefined,
      ),
    )
    .orderBy(desc(post.createdAt))
    .limit(limit)

    .then(res => res.map(({ Post }) => Post));
};

/**
 * Retrieve the number of post from the profiles a profile is following.
 *
 * @param profileId - The id of the profile
 * @returns The number of post from the profiles a profile is following
 */
export const getFollowedProfilesPostsCount = async (profileId: string) =>
  db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(post)
    .innerJoin(FollowTable, eq(post.authorId, FollowTable.followingId))
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
  await tx.insert(post).values(addedPost);
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
    .update(post)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(post.id, postId));
};
