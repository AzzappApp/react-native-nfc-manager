import ERRORS from '@azzapp/shared/lib/errors';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay';
import { follows, isUserFollowings, unFollows } from '../../domains';
import UserGraphQL from '../UserGraphQL';
import ViewerGraphQL from '../ViewerGraphQL';
import type { User } from '../../domains';
import type { GraphQLContext } from '../GraphQLContext';

const toggleFollowingMutation = mutationWithClientMutationId({
  name: 'ToggleFollowing',
  inputFields: {
    userId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The id of the user we want toggle following on',
    },
  },
  outputFields: {
    viewer: {
      type: new GraphQLNonNull(ViewerGraphQL),
      resolve(_root, _args, context) {
        // TODO factorization
        return {
          userId: context.userId,
          isAnonymous: context.isAnonymous,
        };
      },
    },
    user: {
      type: new GraphQLNonNull(UserGraphQL),
    },
  },
  mutateAndGetPayload: async (
    args: { userId: string },
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

    const { id: targetId, type } = fromGlobalId(args.userId);
    if (type !== 'User') {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    let targetUser: User | null;
    try {
      targetUser = await userLoader.load(targetId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!targetUser) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    try {
      if (await isUserFollowings(userId, targetId)) {
        await unFollows(userId, targetId);
      } else {
        await follows(userId, targetId);
      }
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return { user };
  },
});

export default toggleFollowingMutation;
