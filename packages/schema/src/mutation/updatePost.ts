/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import { updatePost } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { postLoader, webCardLoader } from '#loaders';
import { hasWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { Post } from '@azzapp/data';

const updatePostMutation: MutationResolvers['updatePost'] = async (
  _,
  {
    webCardId: gqlWebCardId,
    input: { postId: gqlPostId, allowComments, allowLikes, content },
  },
) => {
  const postId = fromGlobalIdWithType(gqlPostId, 'Post');
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  if (!(await hasWebCardProfileEditorRight(webCardId))) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const post = await postLoader.load(postId);
  if (!post || post.webCardId !== webCardId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!post) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const partialPost = {
    content: content ?? post.content,
    allowComments: allowComments ?? post.allowComments,
    allowLikes: allowLikes ?? post.allowLikes,
  } satisfies Partial<Post>;

  try {
    await updatePost(post.id, partialPost);

    const webCard = await webCardLoader.load(webCardId);
    if (webCard) {
      invalidateWebCard(webCard.userName);
    }

    return {
      post: { ...post, ...partialPost },
    };
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updatePostMutation;
