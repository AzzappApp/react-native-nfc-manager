import { createId } from '@paralleldrive/cuid2';
import db from './db';
import {
  getEntitiesByIds,
  jsonFieldSerializer,
  sqlCountToNumber,
} from './generic';
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
 * Retrieve a profile's posts, ordered by date, with pagination.
 *
 * @param profileId  The id of the profile
 * @param limit The maximum number of posts to retrieve
 * @param offset The offset of the first post to retrieve
 * @returns A list of posts
 */
export const getProfilesPosts = (
  profileId: string,
  limit: number,
  offset: number,
): Promise<Post[]> =>
  db
    .selectFrom('Post')
    .selectAll()
    .where('authorId', '=', profileId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

/**
 * Retrieve the number of posts a profile has.
 * @param profileId - The id of the profile
 * @returns he number of posts the profile has
 */
export const getProfilesPostsCount = (profileId: string): Promise<number> =>
  db
    .selectFrom('Post')
    .select(db.fn.count('id').as('nbPosts'))
    .where('authorId', '=', profileId)
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
    .orderBy('Post.createdAt', 'desc');

  if (after) {
    query = query.where('Post.createdAt', '<', after);
  }

  return query.limit(limit).execute();
};

/**
 * Retrieve a list of posts from the profiles a profile is following, ordered by date,
 * with pagination based on postDate.
 *
 * @param profileId - The id of the profile
 * @param limit - The maximum number of posts to retrieve
 * @param offset - the offset of the first post to retrieve (based on postDate)
 * @returns A list of posts
 */
export const getFollowedProfilesPosts = async (
  profileId: string,
  limit: number,
  after: Date | null = null,
): Promise<Post[]> => {
  let query = db
    .selectFrom('Post')
    .selectAll()
    .innerJoin('Follow', 'Post.authorId', 'Follow.followingId')
    .where('Follow.followerId', '=', profileId)
    .orderBy('Post.createdAt', 'desc');

  if (after) {
    query = query.where('Post.createdAt', '<', after);
  }

  return query.limit(limit).execute();
};

/**
 * Retrieve the number of posts from the profiles a profile is following.
 *
 * @param profileId - The id of the profile
 * @returns The number of posts from the profiles a profile is following
 */
export const getFollowedProfilesPostsCount = async (
  profileId: string,
): Promise<number> =>
  db
    .selectFrom('Post')
    .select(db.fn.count('id').as('nbPosts'))
    .innerJoin('Follow', 'Post.authorId', 'Follow.followingId')
    .where('Follow.followerId', '=', profileId)
    .executeTakeFirstOrThrow()
    .then(({ nbPosts }) => sqlCountToNumber(nbPosts));

/**
 * Create a post.
 *
 * @param values - the post fields, excluding the id and the postDate
 * @param qc - The query creator to use (profile for transactions)
 * @returns The created post
 */
export const createPost = async (
  values: Omit<Post, 'createdAt' | 'id'>,
  qc: QueryCreator<Database> = db,
): Promise<Post> => {
  const post = {
    id: createId(),
    ...values,
  };
  await qc.insertInto('Post').values(postSerializer(post)).execute();
  // TODO should we return the post from the database instead? createdAt might be different
  return { ...post, createdAt: new Date() };
};

const jsonFields = ['medias'] as const;

const postSerializer = jsonFieldSerializer(jsonFields);
