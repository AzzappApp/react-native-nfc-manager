import {
  eq,
  desc,
  sql,
  and,
  lt,
  notInArray,
  inArray,
  count,
  like,
  or,
} from 'drizzle-orm';
import { db, transaction } from '../database';
import {
  FollowTable,
  PostReactionTable,
  PostTable,
  WebCardTable,
} from '../schema';
import { getMediasByIds } from './mediaQueries';
import { getTopPostsComment } from './postCommentQueries';
import type { Media, Post, PostComment, WebCard } from '../schema';
import type { InferInsertModel, SQL } from 'drizzle-orm';

export type NewPost = InferInsertModel<typeof PostTable>;

export type PostWithMedias = Omit<Post, 'medias'> & { medias: Media[] };

export type PostWithCommentAndAuthor = PostWithMedias & {
  comment: (PostComment & { author: WebCard }) | null;
};

/**
 * Retrieve a post by its id.
 * @param id - The id of the post to retrieve
 * @returns the post or null if not found
 */
export const getPostById = async (id: string): Promise<Post | null> =>
  db()
    .select()
    .from(PostTable)
    .where(eq(PostTable.id, id))
    .then(res => res[0] ?? null);

export type PostWithMedia = Omit<Post, 'medias'> & { medias: Media[] };
/**
 * Retrieve a post by its id with its medias.
 * @param id - The id of the post to retrieve
 * @returns A post and its medias
 */
export const getPostByIdWithMedia = async (
  id: string,
): Promise<PostWithMedia | null> => {
  const res = await db().select().from(PostTable).where(eq(PostTable.id, id));

  const post = res[0];
  const medias = (await getMediasByIds(post.medias)).filter(
    media => media !== null,
  );

  return { ...post, medias };
};

/**
 * Retrieve a web card's post with their medias , ordered by date, with pagination.
 *
 * @param webCardId  The id of the webCard
 * @param limit The maximum number of post to retrieve
 * @param excludedId The id of a post to exclude from the search
 * @param before The date of the first post to retrieve
 * @returns A list of post
 */
export const getWebCardsPostsWithMedias = async (
  webCardId: string,
  limit: number,
  excludedId?: string,
  before?: Date,
): Promise<PostWithMedia[]> => {
  const conditions: SQL[] = [eq(PostTable.webCardId, webCardId)];

  if (excludedId) {
    conditions.push(notInArray(PostTable.id, [excludedId]));
  }

  const posts = await db()
    .select()
    .from(PostTable)
    .where(
      and(
        ...conditions,
        before ? sql`${PostTable.createdAt} < ${before}` : undefined,
        eq(PostTable.deleted, false),
      ),
    )
    .orderBy(desc(PostTable.createdAt))
    .limit(limit);

  const mediasIds = posts.reduce<string[]>((mediasIds, post) => {
    return [...mediasIds, ...post.medias];
  }, []);

  const medias =
    mediasIds.length > 0
      ? (await getMediasByIds(mediasIds)).filter(media => media !== null)
      : [];

  return posts.map(post => ({
    ...post,
    medias: medias.filter(media =>
      post.medias.find(postMedia => media.id === postMedia),
    ),
  }));
};

/**
 * Search for posts, ordered by date, with pagination.
 *
 * @param args - The arguments to filter the result
 * @param args.after - The date to start the search from
 * @param args.limit - The number of posts to retrieve
 * @param args.search - The search string to filter the posts
 *
 * @returns A list of post
 */
export const searchPosts = async ({
  after = null,
  limit,
  search,
}: {
  after?: Date | null;
  limit: number;
  search?: string;
}): Promise<Post[]> =>
  db()
    .select()
    .from(PostTable)
    .innerJoin(WebCardTable, eq(PostTable.webCardId, WebCardTable.id))
    .where(
      and(
        eq(PostTable.deleted, false),
        eq(WebCardTable.deleted, false),
        eq(WebCardTable.cardIsPublished, true),
        after ? lt(PostTable.createdAt, after) : undefined,
        or(
          search ? like(PostTable.content, `%${search}%`) : undefined,
          search ? like(WebCardTable.userName, `%${search}%`) : undefined,
        ),
      ),
    )
    .orderBy(desc(PostTable.createdAt))
    .limit(limit)
    .then(res => res.map(({ Post }) => Post));

/**
 * Retrieve a webCard's post, ordered by date, with pagination.
 *
 * @param webCardId  The id of the webCard
 * @param limit The maximum number of post to retrieve
 * @param offset The offset of the first post to retrieve
 * @returns A list of post
 */
export const getWebCardPosts = async (
  webCardId: string,
  limit?: number,
  offset?: number,
) => {
  const query = db()
    .select()
    .from(PostTable)
    .where(
      and(eq(PostTable.webCardId, webCardId), eq(PostTable.deleted, false)),
    )
    .orderBy(desc(PostTable.createdAt));

  if (limit) {
    return query.limit(limit).offset(offset ?? 0);
  }

  return query;
};

/**
 * Retrieve a webCard's post, ordered by date, with pagination.
 *
 * @param webCardId  The id of the webCard
 * @param limit The maximum number of post to retrieve
 * @param offset The offset of the first post to retrieve
 * @returns A list of post
 */
export const getProfilesPostsWithTopComment = async (
  webCardId: string,
  limit: number,
  offset = 0,
): Promise<PostWithCommentAndAuthor[]> => {
  const posts = await db()
    .select()
    .from(PostTable)
    .where(
      and(eq(PostTable.webCardId, webCardId), eq(PostTable.deleted, false)),
    )
    .orderBy(desc(PostTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (posts.length === 0) return [];

  const comments = await getTopPostsComment(
    posts.filter(post => post.allowComments).map(post => post.id),
  );

  const mediasIds = posts.reduce<string[]>((mediasIds, post) => {
    return [...mediasIds, ...post.medias];
  }, []);

  const medias = (await getMediasByIds(mediasIds)).filter(
    media => media !== null,
  );

  return posts.map(post => ({
    ...post,
    comment: comments.find(comment => comment.postId === post.id) ?? null,
    medias: medias.filter(media =>
      post.medias.find(postMedia => media.id === postMedia),
    ),
  }));
};

/**
 * Retrieve a list of posts from a web card that a web card is following
 * with pagination based on postDate.
 *
 * @param webCardId - The id of the web card for which to retrieve the post
 * @param limit - The maximum number of post to retrieve
 * @param offset - the offset of the first post to retrieve (based on postDate)
 * @returns A list of post
 */
export const getFollowingsPosts = async (
  webCardId: string,
  limit: number,
  after: Date | null = null,
): Promise<Post[]> =>
  db()
    .select({
      Post: PostTable,
    })
    .from(PostTable)
    .innerJoin(FollowTable, eq(PostTable.webCardId, FollowTable.followingId))
    .innerJoin(WebCardTable, eq(FollowTable.followingId, WebCardTable.id))
    .where(
      and(
        eq(PostTable.deleted, false),
        eq(FollowTable.followerId, webCardId),
        eq(WebCardTable.deleted, false),
        eq(WebCardTable.cardIsPublished, true),
        after ? lt(PostTable.createdAt, after) : undefined,
      ),
    )
    .orderBy(desc(PostTable.createdAt))
    .limit(limit)
    .then(res => res.map(({ Post }) => Post));

/**
 * Retrieve the number of post from the webCards a webCard is following.
 *
 * @param webCardId - The id of the webCard
 * @returns The number of post from the webCards a webCard is following
 */
export const getFollowingsPostsCount = async (webCardId: string) =>
  db()
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(PostTable)
    .innerJoin(FollowTable, eq(PostTable.webCardId, FollowTable.followingId))
    .innerJoin(WebCardTable, eq(FollowTable.followingId, WebCardTable.id))
    .where(
      and(
        eq(PostTable.deleted, false),
        eq(FollowTable.followerId, webCardId),
        eq(WebCardTable.deleted, false),
        eq(WebCardTable.cardIsPublished, true),
      ),
    )
    .then(res => res[0].count);

/**
 * Create a post.
 *
 * @param newPost - the post fields to create
 * @returns The created post id
 */
export const createPost = async (newPost: NewPost) =>
  db()
    .insert(PostTable)
    .values(newPost)
    .$returningId()
    .then(res => res[0].id);

/**
 * Update the post
 *
 * @param postId - The id of the post to update
 * @param updates - the updates to apply to the post
 */
export const updatePost = async (
  postId: string,
  updates: Partial<Omit<Post, 'id'>>,
) => {
  await db().update(PostTable).set(updates).where(eq(PostTable.id, postId));
};

// TODO the limit should be applied on the post table to avoid bad count
// for deleted post
/**
 * Retrieve a list of post liked by a web card
 * with pagination based on postDate.
 *
 * @param webCardId - The id of the webCardId for which to retrieve the post
 * @param limit - The maximum number of post to retrieve
 * @param offset - the offset of the first post to retrieve (based on postDate)
 * @returns A list of post
 */
export const getLikedPosts = async (
  webCardId: string,
  limit: number,
  after: Date | null = null,
): Promise<Post[]> => {
  // The limit clause is applied AFTER the join operation
  // So there is 2 requests to apply the limit on post reaction table
  const subquery = db()
    .select()
    .from(PostReactionTable)
    .where(
      and(
        eq(PostReactionTable.webCardId, webCardId),
        after ? lt(PostReactionTable.createdAt, after) : undefined,
      ),
    )
    .orderBy(desc(PostReactionTable.createdAt))
    .limit(limit)
    .as('LimitedPostReactionTable');

  return db()
    .select()
    .from(PostTable)
    .innerJoin(subquery, eq(PostTable.id, subquery.postId))
    .where(eq(PostTable.deleted, false))
    .then(res => res.map(({ Post }) => Post));
};

/**
 * Mark a post as deleted, and update the related web card counters.
 *
 * @param postId
 * @param userId
 * @returns
 */
export const markPostAsDeleted = async (postId: string, userId: string) =>
  transaction(async () => {
    const post = await db()
      .select()
      .from(PostTable)
      .where(eq(PostTable.id, postId))
      .then(res => res[0]);

    if (!post) {
      return null;
    }

    const deleteInfos = {
      deleted: true,
      deletedBy: userId,
      deletedAt: new Date(),
    };

    await db()
      .update(PostTable)
      .set(deleteInfos)
      .where(eq(PostTable.id, postId));

    await db()
      .update(WebCardTable)
      .set({
        nbPosts: sql`GREATEST(nbPosts - 1, 0)`,
      })
      .where(eq(WebCardTable.id, post.webCardId));

    await db()
      .update(WebCardTable)
      .set({
        nbPostsLiked: sql`GREATEST(nbPostsLiked - 1, 0)`,
      })
      .where(
        inArray(
          WebCardTable.id,
          sql`(select webCardId from PostReaction where postId = ${post.id})`,
        ),
      );
    return {
      ...post,
      ...deleteInfos,
    };
  });

// TODO this function does not handle the case where the post is already deleted
// also the return type is more a webcard than a post and it should not be here
export const getPostLikesWebCard = async (
  postId: string,
  options: { limit: number; offset: number },
) => {
  return db()
    .select()
    .from(PostReactionTable)
    .where(eq(PostReactionTable.postId, postId))
    .innerJoin(
      WebCardTable,
      and(
        eq(WebCardTable.id, PostReactionTable.webCardId),
        eq(WebCardTable.cardIsPublished, true),
        eq(WebCardTable.deleted, false),
      ),
    )
    .offset(options.offset)
    .limit(options.limit)
    .then(res => res.map(({ WebCard }) => WebCard));
};

// TODO this function does not handle the case where the post is already deleted
// also the return type is more a webcard than a post and it should not be here
export const getPostLikesWebCardCount = async (postId: string) => {
  return db()
    .select({ count: count() })
    .from(PostReactionTable)
    .where(eq(PostReactionTable.postId, postId))
    .innerJoin(
      WebCardTable,
      and(
        eq(WebCardTable.id, PostReactionTable.webCardId),
        eq(WebCardTable.cardIsPublished, true),
        eq(WebCardTable.deleted, false),
      ),
    )
    .then(res => res[0].count);
};
