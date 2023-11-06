import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { getPostByIdWithMedia, insertPostComment } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const createPostComment: MutationResolvers['createPostComment'] = async (
  _,
  { input: { postId, comment } },
  { auth, loaders },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { id: targetId, type } = fromGlobalId(postId);
  if (type !== 'Post') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  try {
    const post = await getPostByIdWithMedia(targetId);
    if (!post?.allowComments) throw new GraphQLError(ERRORS.INVALID_REQUEST);

    const postComment = {
      webCardId: profile.webCardId,
      postId: targetId,
      comment,
    };
    const postCommentId = await insertPostComment(postComment);

    return {
      postComment: {
        id: postCommentId,
        ...postComment,
        createdAt: new Date(),
      },
    };
  } catch (error) {
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default createPostComment;
