import ERRORS from '@azzapp/shared/lib/errors';
import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { createPost, getPostById } from '../../domains/Post';
import { getUserById } from '../../domains/User';
import PostGraphQL from '../PostGraphQL';
import { MediaInputGraphQL } from './commonsTypes';
import type { Post } from '../../domains/Post';
import type { User } from '../../domains/User';
import type { GraphQLContext } from '../GraphQLContext';

const createPostMutation = mutationWithClientMutationId({
  name: 'CreatePost',
  inputFields: {
    media: {
      type: new GraphQLNonNull(MediaInputGraphQL),
      description: 'The media of the publication',
    },
    content: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The text content of the publication',
    },
    allowComments: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Does this post allow comments',
    },
    allowLikes: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Does this post allow likes',
    },
  },
  outputFields: {
    post: {
      type: PostGraphQL,
    },
  },
  mutateAndGetPayload: async (
    {
      media,
      content,
      allowComments,
      allowLikes,
    }: Omit<Post, 'authorId' | 'id' | 'postDate'>,
    { userId, isAnonymous }: GraphQLContext,
  ) => {
    if (!userId || isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let user: User | null;
    try {
      user = await getUserById(userId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!user) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    if (media.ratio == null) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    const postId = await createPost({
      media,
      authorId: userId,
      allowComments,
      allowLikes,
      content,
    });

    // TODO find a better solution
    return { post: await getPostById(postId) };
  },
});

export default createPostMutation;
