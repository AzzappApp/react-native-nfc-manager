import ERRORS from '@azzapp/shared/lib/errors';
import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { createMedia, createPost, db } from '../../domains';
import PostGraphQL from '../PostGraphQL';
import { MediaInputGraphQL } from './commonsTypes';
import type { Media, User } from '../../domains';
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
    }: {
      media: Omit<Media, 'id' | 'ownerId'>;
      content: string;
      allowComments: boolean;
      allowLikes: boolean;
    },
    { userInfos: { userId, isAnonymous }, userLoader }: GraphQLContext,
  ) => {
    if (!userId || isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let user: User | null;
    try {
      user = await userLoader.load(userId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!user) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    if (media.ratio == null) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    try {
      const post = await db.transaction().execute(async trx => {
        const post = await createPost(
          {
            authorId: userId,
            content,
            allowComments,
            allowLikes,
          },
          trx,
        );

        await createMedia(
          {
            ownerId: post.id,
            ...media,
          },
          trx,
        );
        return post;
      });
      return { post };
    } catch {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  },
});

export default createPostMutation;
