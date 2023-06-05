import { fromGlobalId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { insertPostComment } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const createPostComment: MutationResolvers['createPostComment'] = async (
  _,
  { input },
  { auth },
) => {
  if (auth.isAnonymous) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const profileId = getProfileId(auth);
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(input.postId);
  if (type !== 'Post') {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  try {
    const postComment = await insertPostComment(
      profileId,
      targetId,
      input.comment,
    );

    return { postComment };
  } catch (e) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
  //have to refetch because Kysely/planetscale doesn't support returning
};

export default createPostComment;
