/* eslint-disable @typescript-eslint/ban-ts-comment */
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { updatePost } from '#domains';
import type { Post } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const updatePostMutation: MutationResolvers['updatePost'] = async (
  _,
  { input },
  { auth, loaders, cardUpdateListener }: GraphQLContext,
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

  const partialPost: Partial<Omit<Post, 'createdAt' | 'id'>> = {
    ...postInput,
  } as Post;

  try {
    await updatePost(post.id, partialPost);

    const profile = await loaders.Profile.load(profileId);
    cardUpdateListener(profile!.userName);

    return {
      post: { ...post, ...partialPost },
    };
  } catch (error) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updatePostMutation;
