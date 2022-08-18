import ERRORS from '@azzapp/shared/lib/errors';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay';
import { follow, isFollowing, unFollow } from '../../domains/Followers';
import { getUserById } from '../../domains/User';
import UserGraphQL from '../UserGraphQL';
import ViewerGraphQL from '../ViewerGraphQL';
import type { User } from '../../domains/User';
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
      resolve({ userId }) {
        return getUserById(userId);
      },
    },
  },
  mutateAndGetPayload: async (
    args: { userId: string },
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

    const { id: targetId, type } = fromGlobalId(args.userId);
    if (type !== 'User') {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    let targetUser: User | null;
    try {
      targetUser = await getUserById(targetId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!targetUser) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    try {
      if (await isFollowing(user.id, targetUser.id)) {
        await unFollow(user.id, targetUser.id);
      } else {
        await follow(user.id, targetUser.id);
      }
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return { userId };
  },
});

export default toggleFollowingMutation;
