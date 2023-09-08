import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { insertPostComment } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const createPostComment: MutationResolvers['createPostComment'] = async (
  _,
  { input: { postId, comment } },
  { auth },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(postId);
  if (type !== 'Post') {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  try {
    const postComment = await insertPostComment(profileId, targetId, comment);

    return { postComment };
  } catch (error) {
    console.error(error);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createPostComment;
