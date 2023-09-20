import { createId } from '@paralleldrive/cuid2';
import { eq, sql, and, desc, inArray } from 'drizzle-orm';
import { text, index, mysqlTable } from 'drizzle-orm/mysql-core';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import db, { cols } from './db';
import { getMediasByIds } from './medias';
import { PostTable } from './posts';
import { ProfileTable } from './profiles';
import type { Media } from './medias';
import type { Profile } from './profiles';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const PostCommentTable = mysqlTable(
  'PostComment',
  {
    id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
    profileId: cols.cuid('profileId').notNull(),
    postId: cols.cuid('postId').notNull(),
    comment: text('comment').notNull(),
    createdAt: cols.dateTime('createdAt').notNull(),
  },
  table => {
    return {
      postIdIdx: index('PostComment_postId_idx').on(table.postId),
    };
  },
);

export type PostComment = InferSelectModel<typeof PostCommentTable>;
export type NewPostComment = InferInsertModel<typeof PostCommentTable>;
export type PostCommentWithProfile = Pick<Profile, 'firstName' | 'lastName'> &
  PostComment & { media: Media };

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
    .innerJoin(
      ProfileTable,
      and(
        eq(ProfileTable.id, PostCommentTable.profileId),
        eq(ProfileTable.cardIsPublished, true),
      ),
    )
    .orderBy(desc(PostCommentTable.createdAt))
    .limit(limit);

  const mediasMap = (
    await getMediasByIds(
      convertToNonNullArray(
        res.map(({ Profile }) => Profile.coverData?.mediaId),
      ),
    )
  ).reduce((acc, media) => {
    if (!media) return acc;
    acc.set(media.id, media);
    return acc;
  }, new Map<string, Media>());

  const result: PostCommentWithProfile[] = [];

  for (const { PostComment, Profile } of res) {
    const media = mediasMap.get(Profile.coverData?.mediaId ?? '');
    if (!media) continue;
    result.push({
      ...PostComment,
      firstName: Profile.firstName,
      lastName: Profile.lastName,
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
  postId: string[],
): Promise<Array<PostComment & { author: Profile }>> => {
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
