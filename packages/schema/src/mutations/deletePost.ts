import { GraphQLError } from 'graphql';
import { db, deletePost as deletePostDb } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

const deletePost: MutationResolvers['deletePost'] = async (
  _,
  { postId: gqlPostId },
  { loaders, auth, postsToRevalidate, cardUsernamesToRevalidate },
) => {
  const userId = auth.userId;
  const postId = fromGlobalIdWithType(gqlPostId, 'Post');
  const post = await loaders.Post.load(postId);

  if (!post) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(post.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  await db.transaction(async trx => {
    await deletePostDb(postId, userId, trx);
  });

  postsToRevalidate.add({ id: post.id, userName: webCard.userName });
  cardUsernamesToRevalidate.add(webCard.userName);

  return {
    postId: gqlPostId,
  };
};

export default deletePost;
