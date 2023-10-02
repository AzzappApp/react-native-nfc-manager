/* eslint-disable @typescript-eslint/ban-ts-comment */
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { updatePost } from '#domains';
import type { NewPost } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const updatePostMutation: MutationResolvers['updatePost'] = async (
  _,
  { input },
  { auth, loaders, cardUsernamesToRevalidate }: GraphQLContext,
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { postId, ...postInput } = input;
  const { id: targetId } = fromGlobalId(postId);

  const post = await loaders.Post.load(targetId);

  if (!post) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const partialPost: Partial<NewPost> = {
    ...postInput,
    allowComments: postInput.allowComments ?? post.allowComments,
    allowLikes: postInput.allowLikes ?? post.allowLikes,
  };

  try {
    await updatePost(post.id, partialPost);

    const profile = await loaders.Profile.load(profileId);
    cardUsernamesToRevalidate.add(profile!.userName);

    return {
      post: { ...post, ...partialPost },
    };
  } catch (error) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updatePostMutation;
