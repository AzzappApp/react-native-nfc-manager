/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { updatePost } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { NewPost } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

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

  const partialPost: Partial<NewPost> = {
    content: content ?? post.content,
    allowComments: allowComments ?? post.allowComments,
    allowLikes: allowLikes ?? post.allowLikes,
  };

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
