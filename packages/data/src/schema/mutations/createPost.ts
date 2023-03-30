import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { createMedia, createPost, db } from '#domains';
import PostGraphQL from '../PostGraphQL';
import { MediaInputGraphQL } from './commonsTypes';
import type { Media } from '#domains';
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
    const profileId = getProfileId(auth);
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    try {
      const post = await db.transaction().execute(async trx => {
        await createMedia(media, trx);
        const post = await createPost(
          {
            authorId: profileId,
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
