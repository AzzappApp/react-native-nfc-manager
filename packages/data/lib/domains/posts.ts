import * as uuid from 'uuid';
import db from './db';
import { getEntitiesByIds, sqlCountToNumber } from './generic';
import type { Database } from './db';
import type { Post } from '@prisma/client';
import type { QueryCreator } from 'kysely';

/**
 * Retrieve a list of posts by their ids.
 * @param ids - The ids of the posts to retrieve
 * @returns A list of posts, where the order of the posts matches the order of the ids
 */
export const getPostsByIds = (
  ids: readonly string[],
): Promise<Array<Post | null>> => getEntitiesByIds('Post', ids);

/**
 * Retrieve a user's posts, ordered by date, with pagination.
 *
 * @param userId  The id of the user
 * @param limit The maximum number of posts to retrieve
 * @param offset The offset of the first post to retrieve
 * @returns A list of posts
 */
export const getUsersPosts = (
  userId: string,
  limit: number,
  offset: number,
): Promise<Post[]> =>
  db
    .selectFrom('Post')
    .selectAll()
    .where('authorId', '=', userId)
    .orderBy('postDate', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

/**
 * Retrieve the number of posts a user has.
 * @param userId - The id of the user
 * @returns he number of posts the user has
 */
export const getUsersPostsCount = (userId: string): Promise<number> =>
  db
    .selectFrom('Post')
    .select(db.fn.count('id').as('nbPosts'))
    .where('authorId', '=', userId)
    .executeTakeFirstOrThrow()
    .then(({ nbPosts }) => sqlCountToNumber(nbPosts));

/**
 * Retrieve a list of all posts, ordered by date, with pagination based on postDate.
 *
 * @param limit - The maximum number of posts to retrieve
 * @param offset - the offset of the first post to retrieve (based on postDate)
 * @returns A list of posts
 */
export const getAllPosts = async (
  limit: number,
  after: Date | null = null,
): Promise<Post[]> => {
  let query = db
    .selectFrom('Post')
    .selectAll()
    .orderBy('Post.postDate', 'desc');

  if (after) {
    query = query.where('Post.postDate', '<', after);
  }

  return query.limit(limit).execute();
};

/**
 * Retrieve a list of posts from the users a user is following, ordered by date,
 * with pagination based on postDate.
 *
 * @param userId - The id of the user
 * @param limit - The maximum number of posts to retrieve
 * @param offset - the offset of the first post to retrieve (based on postDate)
 * @returns A list of posts
 */
export const getFollowedUsersPosts = async (
  userId: string,
  limit: number,
  after: Date | null = null,
): Promise<Post[]> => {
  let query = db
    .selectFrom('Post')
    .selectAll()
    .innerJoin('Follow', 'Post.authorId', 'Follow.followingId')
    .where('Follow.followerId', '=', userId)
    .orderBy('Post.postDate', 'desc');

  if (after) {
    query = query.where('Post.postDate', '<', after);
  }

  return query.limit(limit).execute();
};

/**
 * Retrieve the number of posts from the users a user is following.
 *
 * @param userId - The id of the user
 * @returns The number of posts from the users a user is following
 */
export const getFollowedUsersPostsCount = async (
  userId: string,
): Promise<number> =>
  db
    .selectFrom('Post')
    .select(db.fn.count('id').as('nbPosts'))
    .innerJoin('Follow', 'Post.authorId', 'Follow.followingId')
    .where('Follow.followerId', '=', userId)
    .executeTakeFirstOrThrow()
    .then(({ nbPosts }) => sqlCountToNumber(nbPosts));

/**
 * Create a post.
 *
 * @param values - the post fields, excluding the id and the postDate
 * @param qc - The query creator to use (user for transactions)
 * @returns The created post
 */
export const createPost = async (
  values: Omit<Post, 'id' | 'postDate'>,
  qc: QueryCreator<Database> = db,
): Promise<Post> => {
  const post = {
    id: uuid.v4(),
    postDate: new Date(),
    ...values,
  };
  await qc.insertInto('Post').values(post).execute();
  return post;
};
