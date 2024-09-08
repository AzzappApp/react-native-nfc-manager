import { eq, sql, and, desc, inArray } from 'drizzle-orm';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { db, transaction } from '../database';
import { PostCommentTable, PostTable, WebCardTable } from '../schema';
import { getMediasByIds } from './mediaQueries';
import type { Media, PostComment, WebCard } from '../schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * Create a post comment, this will also increment the post `counterComments` field
 *
 * @param newPostComment - The post comment fields
 * @return The id of the created post comment
 */
export const createPostComment = async (
  newPostComment: InferInsertModel<typeof PostCommentTable>,
) =>
  transaction(async () => {
    const id = await db()
      .insert(PostCommentTable)
      .values(newPostComment)
      .$returningId()
      .then(res => res[0].id);

    await db()
      .update(PostTable)
      .set({ counterComments: sql`${PostTable.counterComments} + 1` })
      .where(eq(PostTable.id, newPostComment.postId));

    return id;
  });

// TODO the signature of this type is wrong, firstly some webcard might not have a media
// secondly the casing of the fields are not consistent with the rest of the codebase
// and finally I'm not sure we really need the media field here
export type PostCommentWithWebCard = {
  PostComment: PostComment;
  WebCard: WebCard;
  media: Media;
};
// TODO the signature of this function is wrong, it should be `before: Date | null`
/**
 * Retrieves posts comments ordered by date, with the associated web card authoring the comment
 *
 * @param limit - The maximum number of comments to retrieve
 * @param before - The maximum date of creation for the comments to retrieve
 * @returns A list of PostComment
 */
export const getPostCommentsWithWebCard = async (
  postId: string,
  limit: number,
  before?: Date,
) => {
  const res = await db()
    .select()
    .from(PostCommentTable)
    .where(
      and(
        eq(PostCommentTable.postId, postId),
        eq(PostCommentTable.deleted, false),
        before ? sql`${PostCommentTable.createdAt} < ${before}` : undefined,
      ),
    )
    .innerJoin(
      WebCardTable,
      and(
        eq(WebCardTable.id, PostCommentTable.webCardId),
        eq(WebCardTable.cardIsPublished, true),
      ),
    )
    .orderBy(desc(PostCommentTable.createdAt))
    .limit(limit);

  const mediasMap = (
    await getMediasByIds(
      convertToNonNullArray(res.map(({ WebCard }) => WebCard.coverMediaId)),
    )
  ).reduce((acc, media) => {
    if (!media) return acc;
    acc.set(media.id, media);
    return acc;
  }, new Map<string, Media>());

  const result: PostCommentWithWebCard[] = [];

  for (const { PostComment, WebCard } of res) {
    const media = mediasMap.get(WebCard.coverMediaId ?? '');
    if (!media) continue;
    result.push({
      PostComment,
      WebCard,
      media,
    });
  }

  return result;
};

/**
 * Retrieves posts comments ordered by date
 *
 * @param postId - The id of the post to retrieve comments for
 * @param limit - The maximum number of comments to retrieve
 * @param after - The date to fetch comments after
 * @returns A list of posts comments
 */
export const getPostCommentsByDate = async (
  postId: string,
  limit: number,
  after: Date | null = null,
): Promise<PostComment[]> =>
  db()
    .select()
    .from(PostCommentTable)
    .where(
      and(
        eq(PostCommentTable.postId, postId),
        eq(PostCommentTable.deleted, false),
        after ? sql`${PostCommentTable.createdAt} < ${after}` : undefined,
      ),
    )
    .orderBy(desc(PostCommentTable.createdAt))
    .limit(limit);

/**
 * Retrieves a post comment by its id
 *
 * @param id - The id of the post comment to retrieve
 * @returns The post comment if it exists
 */
export const getPostCommentById = async (
  id: string,
): Promise<PostComment | null> =>
  db()
    .select()
    .from(PostCommentTable)
    .where(eq(PostCommentTable.id, id))
    .then(rows => rows[0] ?? null);

// TODO the signature of this function is strange
/**
 * Retrieves posts comments ordered by createdAt date
 * @param limit - The maximum number of profiles to retrieve
 * @param offset - The number of profiles to skip
 * @returns A list of PostComment
 */
export const getTopPostsComment = async (
  postIds: string[],
): Promise<Array<PostComment & { author: WebCard }>> => {
  if (!postIds.length) {
    return [];
  }
  const comments = await db()
    .select({
      postsId: PostCommentTable.postId,
      createdAt: sql<string>`max(createdAt)`,
    })
    .from(PostCommentTable)
    .where(inArray(PostCommentTable.postId, postIds))
    .groupBy(PostCommentTable.postId);

  if (comments.length === 0) return [];

  return db()
    .select()
    .from(PostCommentTable)
    .where(
      and(
        inArray(
          PostCommentTable.postId,
          comments.map(comment => comment.postsId),
        ),
        eq(PostCommentTable.deleted, false),
      ),
    )
    .innerJoin(WebCardTable, eq(PostCommentTable.webCardId, WebCardTable.id))
    .then(res =>
      res.map(({ PostComment, WebCard }) => ({
        ...PostComment,
        author: WebCard,
      })),
    );
};

/**
 * Mark a post comment as deleted
 *
 * @param id - The id of the post comment to mark as deleted
 * @param userId - The id of the user marking the post comment as deleted
 */
export const markPostCommentAsDeleted = async (id: string, userId: string) =>
  transaction(async () => {
    const res = await db()
      .update(PostCommentTable)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
        deleted: true,
      })
      .where(eq(PostCommentTable.id, id));
    if (res.rowsAffected > 0) {
      const post = await db()
        .select({ post: PostTable })
        .from(PostTable)
        .innerJoin(PostCommentTable, eq(PostTable.id, PostCommentTable.postId))
        .where(eq(PostCommentTable.id, id))
        .then(res => res[0]?.post);
      if (post) {
        await db()
          .update(PostTable)
          .set({
            counterComments: sql`GREATEST(0, ${PostTable.counterComments} - 1)`,
          })
          .where(eq(PostTable.id, post.id));
      }
    }
  });

/**
 * Update a post comment
 *
 * @param id - The id of the post comment to update
 * @param comment - the new comment for the post comment
 */
export const updatePostComment = async (id: string, comment: string) => {
  await db()
    .update(PostCommentTable)
    .set({ comment })
    .where(eq(PostCommentTable.id, id));
};

/**
 * Remove a post comment
 *
 * @param id - The id of the post comment to remove
 * @param userId - The id of the user removing the comment
 */
export const removeComment = async (
  id: string,
  postId: string,
  userId: string,
) => {
  await transaction(async () => {
    await db()
      .update(PostCommentTable)
      .set({
        deleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      })
      .where(
        and(
          eq(PostCommentTable.id, id),
          // This is a check to make sure the comment is really associated with the post
          eq(PostCommentTable.postId, postId),
        ),
      );

    await db()
      .update(PostTable)
      .set({
        counterComments: sql`GREATEST(0, ${PostTable.counterComments} -  1)`,
      })
      .where(eq(PostTable.id, postId));
  });
};
