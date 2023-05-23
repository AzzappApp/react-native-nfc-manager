import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';

import { insertPostComment } from '#domains';
import PostCommentGraphQL from '#schema/PostCommentGraphQL';
import type { GraphQLContext } from '../GraphQLContext';

const createPostComment = mutationWithClientMutationId({
  name: 'CreatePostComment',
  inputFields: {
    postId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The post id we want toggle like on',
    },
    comment: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    postComment: {
      type: new GraphQLNonNull(PostCommentGraphQL),
    },
  },
  mutateAndGetPayload: async (
    args: { postId: string; comment: string },
    { auth }: GraphQLContext,
  ) => {
    if (auth.isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }
    const profileId = getProfileId(auth);
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    const { id: targetId, type } = fromGlobalId(args.postId);
    if (type !== 'Post') {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
    try {
      const postComment = await insertPostComment(
        profileId,
        targetId,
        args.comment,
      );

      return { postComment };
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    //have to refetch because Kysely/planetscale doesn't support returning
  },
});

export default createPostComment;
