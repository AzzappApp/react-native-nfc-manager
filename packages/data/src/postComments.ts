import { eq, sql, and, desc, inArray } from 'drizzle-orm';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import db, { DEFAULT_DATETIME_VALUE, cols } from './db';
import { createId } from './helpers/createId';
import { getMediasByIds, type Media } from './medias';
import { PostTable } from './posts';
import { WebCardTable, type WebCard } from './webCards';
import type { DbTransaction } from './db';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const PostCommentTable = cols.table(
  'PostComment',
  {
    id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
    webCardId: cols.cuid('webCardId').notNull(),
    postId: cols.cuid('postId').notNull(),
    comment: cols.text('comment').notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    deleted: cols.boolean('deleted').notNull().default(false),
    deletedBy: cols.cuid('deletedBy'),
    deletedAt: cols.dateTime('deletedAt'),
  },
  table => {
    return {
      postIdIdx: cols.index('PostComment_postId_idx').on(table.postId),
    };
  },
);

export type PostComment = InferSelectModel<typeof PostCommentTable>;
export type NewPostComment = InferInsertModel<typeof PostCommentTable>;
export type PostCommentWithWebCard = {
  PostComment: PostComment;
  WebCard: WebCard;
  media: Media;
};

/**
 * insert a post comment
 * @param postComment - The post comment to insert
 * @return {*}  {Promise<string>}
 */
export const insertPostComment = async (postComment: NewPostComment) =>
  db.transaction(async trx => {
    const id = createId();

    await trx.insert(PostCommentTable).values({ ...postComment, id });

    await trx
      .update(PostTable)
      .set({
        counterComments: sql`${PostTable.counterComments} + 1`,
      })
      .where(eq(PostTable.id, postComment.postId));

    return id;
  });

/**
 * Retrieves posts comments ordered by date
 * @param limit - The maximum number of comments to retrieve
 * @param before - The maximum date of creation for the comments to retrieve
 * @returns A list of PostComment
 */
export const getPostCommentsWithWebCard = async (
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
      convertToNonNullArray(
        res.map(({ WebCard }) => WebCard.coverData?.mediaId),
      ),
    )
  ).reduce((acc, media) => {
    if (!media) return acc;
    acc.set(media.id, media);
    return acc;
  }, new Map<string, Media>());

  const result: PostCommentWithWebCard[] = [];

  for (const { PostComment, WebCard } of res) {
    const media = mediasMap.get(WebCard.coverData?.mediaId ?? '');
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
        eq(PostCommentTable.deleted, false),
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
export const getTopPostsComment = async (
  postIds: string[],
): Promise<Array<PostComment & { author: WebCard }>> => {
  if (!postIds.length) {
    return [];
  }
  const comments = await db
    .select({
      postsId: PostCommentTable.postId,
      createdAt: sql<string>`max(createdAt)`,
    })
    .from(PostCommentTable)
    .where(inArray(PostCommentTable.postId, postIds))
    .groupBy(PostCommentTable.postId);

  if (comments.length === 0) return [];

  return db
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

export const updatePostComment = async (id: string, comment: string) => {
  return db
    .update(PostCommentTable)
    .set({ comment })
    .where(eq(PostCommentTable.id, id));
};

export const removeComment = async (
  id: string,
  userId: string,
  trx: DbTransaction = db,
) => {
  return trx
    .update(PostCommentTable)
    .set({
      deleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
    })
    .where(eq(PostCommentTable.id, id));
};
