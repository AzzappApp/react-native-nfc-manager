import { createId } from '@paralleldrive/cuid2';
import db from './db';
import { getEntitiesByIds } from './generic';
import type { PostComment } from '@prisma/client';
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
): Promise<PostComment> =>
  db.transaction().execute(async trx => {
    const id = createId();
    const postComment = {
      id,
      profileId,
      postId,
      comment,
      createdAt: new Date(), // better to return the correct date for the sorting, returningAll is not working and avoid a query request
    };
    await trx.insertInto('PostComment').values(postComment).execute();

    await trx
      .updateTable('Post')
      .where('id', '=', postId)
      .set(eb => ({
        counterComments: eb.bxp('counterComments', '+', 1),
      }))
      .execute();

    return postComment;
  });

/**
 * Retrieves posts comments ordered by createdAt date
 * @param limit - The maximum number of profiles to retrieve
 * @param offset - The number of profiles to skip
 * @returns A list of PostComment
 */
export const getPostComments = async (
  postId: string,
  limit: number,
  after: Date | null = null,
): Promise<PostComment[]> => {
  let query = db
    .selectFrom('PostComment')
    .selectAll()
    .where('postId', '=', postId)
    .orderBy('createdAt', 'desc');

  if (after) {
    query = query.where('createdAt', '<', after);
  }
  return query.limit(limit).execute();
};

/**
 * Retrieve a list of post comments by their ids.
 * @param ids - The ids of the comments to retrieve
 * @returns A list of comments, where the order of the posts matches the order of the ids
 */
export const getPostCommentsByIds = (
  ids: readonly string[],
): Promise<Array<PostComment | null>> => getEntitiesByIds('PostComment', ids);
