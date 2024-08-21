import { GraphQLError } from 'graphql';
import { markPostAsDeleted } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

const deletePostMutation: MutationResolvers['deletePost'] = async (
  _,
  { postId: gqlPostId },
  { loaders, auth, postsToRevalidate, cardUsernamesToRevalidate },
) => {
  const userId = auth.userId;
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const postId = fromGlobalIdWithType(gqlPostId, 'Post');
  const post = await loaders.Post.load(postId);
  if (!post) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(post.webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const profile = await loaders.profileByWebCardIdAndUserId.load({
    webCardId: webCard.id,
    userId,
  });

  if (profile?.profileRole !== 'editor') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  try {
    await markPostAsDeleted(postId, userId);
  } catch (error) {
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  postsToRevalidate.add({ id: post.id, userName: webCard.userName });
  cardUsernamesToRevalidate.add(webCard.userName);

  return {
    postId: gqlPostId,
  };
};

export default deletePostMutation;
