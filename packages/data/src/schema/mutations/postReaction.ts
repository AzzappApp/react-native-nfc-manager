import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import {
  deletePostReaction,
  getPostReaction,
  insertPostReaction,
} from '#domains/postReactions';
import PostGraphQL from '#schema/PostGraphQL';
import { ReactionKind } from './commonsTypes';
import type { ReactionKind as ReactionKindType } from '#domains';
import type { GraphQLContext } from '../GraphQLContext';

const togglePostReaction = mutationWithClientMutationId({
  name: 'TogglePostReaction',
  inputFields: {
    postId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The post id we want toggle like on',
    },
    reactionKind: {
      type: ReactionKind,
    },
  },
  outputFields: {
    post: {
      type: new GraphQLNonNull(PostGraphQL),
    },
  },
  mutateAndGetPayload: async (
    args: { postId: string; reactionKind: ReactionKindType },
    { auth, postLoader }: GraphQLContext,
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
      const reaction = await getPostReaction(profileId, targetId);
      if (reaction && reaction.reactionKind === args.reactionKind) {
        await deletePostReaction(profileId, targetId);
      } else {
        await insertPostReaction(profileId, targetId, args.reactionKind);
      }
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    //have to refetch because Kysely/planetscale doesn't support returning
    const post = await postLoader.load(targetId);

    return { post };
  },
});

export default togglePostReaction;
