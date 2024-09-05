import { GraphQLError } from 'graphql';
import { getPostByIdWithMedia, createPostComment } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { webCardLoader } from '#loaders';
import { hasWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const createPostCommentMutation: MutationResolvers['createPostComment'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { postId: gqlPostId, comment } },
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const postId = fromGlobalIdWithType(gqlPostId, 'Post');

    if (!(await hasWebCardProfileEditorRight(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const post = await getPostByIdWithMedia(postId);
    if (!post?.allowComments) throw new GraphQLError(ERRORS.INVALID_REQUEST);

    const webCard = await webCardLoader.load(post.webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!webCard.cardIsPublished) {
      throw new GraphQLError(ERRORS.UNPUBLISHED_WEB_CARD);
    }

    try {
      const postComment = {
        webCardId,
        postId,
        comment,
      };
      const postCommentId = await createPostComment(postComment);

      return {
        postComment: {
          id: postCommentId,
          deleted: false,
          deletedBy: null,
          deletedAt: null,
          ...postComment,
          createdAt: new Date(),
        },
      };
    } catch (error) {
      console.error(error);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

export default createPostCommentMutation;
