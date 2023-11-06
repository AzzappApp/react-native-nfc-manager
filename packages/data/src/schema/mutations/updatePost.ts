/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { updatePost } from '#domains';
import type { NewPost } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const updatePostMutation: MutationResolvers['updatePost'] = async (
  _,
  { input },
  { auth, loaders, cardUsernamesToRevalidate }: GraphQLContext,
) => {
  const { profileId, userId } = auth;

  if (!profileId || !userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const { postId, ...postInput } = input;
  const { id: targetId } = fromGlobalId(postId);

  const post = await loaders.Post.load(targetId);

  if (!post) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const partialPost: Partial<NewPost> = {
    ...postInput,
    allowComments: postInput.allowComments ?? post.allowComments,
    allowLikes: postInput.allowLikes ?? post.allowLikes,
  };

  try {
    await updatePost(post.id, partialPost);

    const webCard = await loaders.WebCard.load(profile.webCardId);
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
