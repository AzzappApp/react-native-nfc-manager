import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import {
  getPostByIdWithMedia,
  getUserProfileWithWebCardId,
  insertPostComment,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const createPostComment: MutationResolvers['createPostComment'] = async (
  _,
  { input: { webCardId: gqlWebCardId, postId: gqlPostId, comment } },
  { auth, loaders },
) => {
  const { userId } = auth;
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const postId = fromGlobalIdWithType(gqlPostId, 'Post');
  const profile =
    userId && (await getUserProfileWithWebCardId(userId, webCardId));

  if (!profile || !isEditor(profile.profileRole) || profile.invited) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const post = await getPostByIdWithMedia(postId);
  if (!post?.allowComments) throw new GraphQLError(ERRORS.INVALID_REQUEST);

  const webCard = await loaders.WebCard.load(post.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!webCard.cardIsPublished) {
    throw new GraphQLError(ERRORS.UNPUBLISHED_WEB_CARD);
  }

  try {
    const postComment = {
      webCardId: profile.webCardId,
      postId,
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
