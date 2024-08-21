/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import { updatePost } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { GraphQLContext } from '#/GraphQLContext';
import type { Post } from '@azzapp/data';

const updatePostMutation: MutationResolvers['updatePost'] = async (
  _,
  {
    webCardId: gqlWebCardId,
    input: { postId: gqlPostId, allowComments, allowLikes, content },
  },
  { loaders, cardUsernamesToRevalidate }: GraphQLContext,
) => {
  const postId = fromGlobalIdWithType(gqlPostId, 'Post');
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const post = await loaders.Post.load(postId);
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

    const webCard = await loaders.WebCard.load(webCardId);
    if (webCard) {
      cardUsernamesToRevalidate.add(webCard.userName);
    }

    return {
      post: { ...post, ...partialPost },
    };
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updatePostMutation;
