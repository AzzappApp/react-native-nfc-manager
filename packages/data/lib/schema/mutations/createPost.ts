import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/lib/errors';
import { createMedia, createPost, db } from '../../domains';
import PostGraphQL from '../PostGraphQL';
import { MediaInputGraphQL } from './commonsTypes';
import type { Media } from '../../domains';
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
      media: Media;
      content: string;
      allowComments: boolean;
      allowLikes: boolean;
    },
    { auth }: GraphQLContext,
  ) => {
    if (auth.isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    try {
      const post = await db.transaction().execute(async trx => {
        await createMedia(media, trx);
        const post = await createPost(
          {
            authorId: auth.profileId,
            content,
            allowComments,
            allowLikes,
            medias: [media.id],
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
