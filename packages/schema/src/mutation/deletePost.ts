import { GraphQLError } from 'graphql';
import { markPostAsDeleted } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidatePost, invalidateWebCard } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { postLoader, webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

const deletePostMutation: MutationResolvers['deletePost'] = async (
  _,
  { postId: gqlPostId },
) => {
  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const postId = fromGlobalIdWithType(gqlPostId, 'Post');
  const post = await postLoader.load(postId);
  if (!post) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await webCardLoader.load(post.webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await checkWebCardProfileEditorRight(webCard.id);

  try {
    await markPostAsDeleted(postId, userId);
  } catch (error) {
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (webCard.userName) {
    invalidatePost(webCard.userName, post.id);
    invalidateWebCard(webCard.userName);
  }
  return {
    postId: gqlPostId,
  };
};

export default deletePostMutation;
