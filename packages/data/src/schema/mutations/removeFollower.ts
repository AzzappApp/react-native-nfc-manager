import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { unfollows } from '#domains';
import ViewerGraphQL from '../ViewerGraphQL';
import type { Profile } from '#domains';
import type { GraphQLContext } from '../GraphQLContext';
import type { Viewer } from '@azzapp/auth/viewer';

const removeFollowerMutation = mutationWithClientMutationId({
  name: 'RemoveFollower',
  inputFields: {
    profileId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The id of the user we want remove as follower',
    },
  },
  outputFields: {
    viewer: {
      type: new GraphQLNonNull(ViewerGraphQL),
      resolve(_root, _args, context: GraphQLContext): Viewer {
        // TODO factorization
        return context.auth;
      },
    },
    removedFollowerId: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  mutateAndGetPayload: async (
    args: { profileId: string; follow: boolean },
    { auth, profileLoader }: GraphQLContext,
  ) => {
    if (auth.isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }
    const profileId = getProfileId(auth);
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    const { id: targetId, type } = fromGlobalId(args.profileId);
    if (type !== 'Profile') {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    let profile: Profile | null;
    try {
      profile = await profileLoader.load(profileId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    if (profile?.public) {
      throw new Error(ERRORS.FORBIDDEN);
    }

    try {
      await unfollows(targetId, profileId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return { removedFollowerId: args.profileId };
  },
});

export default removeFollowerMutation;
