import {
  eq,
  desc,
  sql,
  and,
  lt,
  notInArray,
  inArray,
  count,
} from 'drizzle-orm';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import db, { DEFAULT_DATETIME_VALUE, cols } from './db';
import { FollowTable } from './follows';
import { createId } from './helpers/createId';
import { getMediasByIds, type Media } from './medias';
import { getTopPostsComment } from './postComments';
import { PostReactionTable } from './postReactions';
import { WebCardTable, type WebCard } from './webCards';
import type { DbTransaction } from './db';
import type { PostComment } from './postComments';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

export const PostTable = cols.table(
  'Post',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    webCardId: cols.cuid('webCardId').notNull(),
    content: cols.text('content'),
    allowComments: cols.boolean('allowComments').notNull(),
    allowLikes: cols.boolean('allowLikes').notNull(),
    medias: cols.json('medias').$type<string[]>().notNull(),
    counterReactions: cols.int('counterReactions').default(0).notNull(),
    counterComments: cols.int('counterComments').default(0).notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    updatedAt: cols
      .dateTime('updatedAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    deleted: cols.boolean('deleted').notNull().default(false),
    deletedBy: cols.cuid('deletedBy'),
    deletedAt: cols.dateTime('deletedAt'),
  },
  table => {
    return {
      authorIdIdx: cols.index('Post_webCardId_idx').on(table.webCardId),
    };
  },
);

export type Post = InferSelectModel<typeof PostTable>;
export type NewPost = InferInsertModel<typeof PostTable>;
export type PostWithMedias = Omit<Post, 'medias'> & { medias: Media[] };
export type PostWithCommentAndAuthor = PostWithMedias & {
  comment: (PostComment & { author: WebCard }) | null;
};

/**
 * Retrieve a post by its id.
 * @param id - The id of the post to retrieve
 * @returns A post
 */
export const getPostById = async (id: string) => {
  const res = await db.select().from(PostTable).where(eq(PostTable.id, id));

  if (res.length === 0) return null;
  return res[0];
};

/**
 * Retrieve a post by its ids.
 * @param id - The id of the post to retrieve
 * @returns A post and its medias
 */
export const getPostByIdWithMedia = async (id: string) => {
  const res = await db.select().from(PostTable).where(eq(PostTable.id, id));

  if (res.length === 0) return null;
  const post = res[0];
  const medias = convertToNonNullArray(await getMediasByIds(post.medias));

  return { ...post, medias };
};

/**
 * Retrieve a webCard's post, ordered by date, with pagination.
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
) => {
  const conditions: SQL[] = [eq(PostTable.webCardId, webCardId)];

  if (excludedId) {
    conditions.push(notInArray(PostTable.id, [excludedId]));
  }

  const posts = await db
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
      ? convertToNonNullArray(await getMediasByIds(mediasIds))
      : [];

  return posts.map(post => ({
    ...post,
    medias: medias.filter(media =>
      post.medias.find(postMedia => media.id === postMedia),
    ),
  }));
};

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
  const query = db
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
  const posts = await db
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

  const medias = convertToNonNullArray(await getMediasByIds(mediasIds));

  return posts.map(post => ({
    ...post,
    comment: comments.find(comment => comment.postId === post.id) ?? null,
    medias: medias.filter(media =>
      post.medias.find(postMedia => media.id === postMedia),
    ),
  }));
};

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
 * Retrieve a list of post from the webCards a webCard is following, ordered by date,
 * with pagination based on postDate.
 *
 * @param webCardId - The id of the webCard
 * @param limit - The maximum number of post to retrieve
 * @param offset - the offset of the first post to retrieve (based on postDate)
 * @returns A list of post
 */
export const getFollowingsPosts = async (
  webCardId: string,
  limit: number,
  after: Date | null = null,
) => {
  return db
    .select({
      Post: PostTable,
    })
    .from(PostTable)
    .innerJoin(FollowTable, eq(PostTable.webCardId, FollowTable.followingId))
    .innerJoin(WebCardTable, eq(PostTable.webCardId, WebCardTable.id))
    .where(
      and(
        eq(FollowTable.followerId, webCardId),
        eq(WebCardTable.deleted, false),
        after ? lt(PostTable.createdAt, after) : undefined,
      ),
    )
    .orderBy(desc(PostTable.createdAt))
    .limit(limit)

    .then(res => res.map(({ Post }) => Post));
};

/**
 * Retrieve the number of post from the webCards a webCard is following.
 *
 * @param webCardId - The id of the webCard
 * @returns The number of post from the webCards a webCard is following
 */
export const getFollowingsPostsCount = async (webCardId: string) =>
  db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(PostTable)
    .innerJoin(FollowTable, eq(PostTable.webCardId, FollowTable.followingId))
    .innerJoin(WebCardTable, eq(PostTable.webCardId, WebCardTable.id))
    .where(
      and(
        eq(FollowTable.followerId, webCardId),
        eq(WebCardTable.deleted, false),
      ),
    )
    .then(res => res[0].count);
/**
 * Create a post.
 *
 * @param values - the post fields, excluding the id and the postDate
 * @param tx - The query creator to use
 * @returns The created post
 */
export const createPost = async (values: NewPost, tx: DbTransaction = db) => {
  const id = createId();
  await tx.insert(PostTable).values({ ...values, id });
  return id;
};

/**
 * update the post
 *
 * @param {string} postId
 * @param {(Partial<Omit<Post, 'createdAt' | 'id'>>)} data
 * @return {*}  {Promise<Partial<Post>>}
 */
export const updatePost = async (postId: string, data: Partial<NewPost>) => {
  await db.update(PostTable).set(data).where(eq(PostTable.id, postId));
};

/**
 * Retrieve a list of post liked by a webCardId
 * with pagination based on postDate.
 *
 * @param webCardId - The id of the webCardId
 * @param limit - The maximum number of post to retrieve
 * @param offset - the offset of the first post to retrieve (based on postDate)
 * @returns A list of post
 */
export const getLikedPosts = async (
  webCardId: string,
  limit: number,
  after: Date | null = null,
) => {
  // The limit clause is applied AFTER the join operation
  // So there is 2 requests to apply the limit on post reaction table
  const subquery = db
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

  return db
    .select()
    .from(PostTable)
    .innerJoin(subquery, eq(PostTable.id, subquery.postId))
    .where(eq(PostTable.deleted, false))
    .then(res => res.map(({ Post }) => Post));
};

export const deletePost = async (
  postId: string,
  userId: string,
  trx: DbTransaction,
) => {
  const post = await trx
    .select()
    .from(PostTable)
    .where(eq(PostTable.id, postId))
    .then(res => res[0]);
  if (post) {
    const deleteInfos = {
      deleted: true,
      deletedBy: userId,
      deletedAt: new Date(),
    };
    await trx
      .update(PostTable)
      .set(deleteInfos)
      .where(eq(PostTable.id, postId));

    await trx
      .update(WebCardTable)
      .set({
        nbPosts: sql`GREATEST(nbPosts - 1, 0)`,
      })
      .where(eq(WebCardTable.id, post.webCardId));

    await trx
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
  }

  return null;
};

export const getPostLikesWebcard = async (
  postId: string,
  options: { limit: number; offset: number },
) => {
  return db
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

export const getPostLikesWebcardCount = async (postId: string) => {
  return db
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
