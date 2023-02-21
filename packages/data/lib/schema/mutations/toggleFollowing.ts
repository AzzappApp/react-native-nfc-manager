import ERRORS from '@azzapp/shared/lib/errors';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql';
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay';
import { follows, unfollows } from '../../domains';
import ProfileGraphQL from '../ProfileGraphQL';
import ViewerGraphQL from '../ViewerGraphQL';
import type { Profile, Viewer } from '../../domains';
import type { GraphQLContext } from '../GraphQLContext';

const toggleFollowingMutation = mutationWithClientMutationId({
  name: 'ToggleFollowing',
  inputFields: {
    profileId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The id of the user we want toggle following on',
    },
    follow: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Should we follow or unfollow the user',
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
    profile: {
      type: new GraphQLNonNull(ProfileGraphQL),
    },
  },
  mutateAndGetPayload: async (
    args: { profileId: string; follow: boolean },
    { auth, profileLoader }: GraphQLContext,
  ) => {
    if (auth.isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    const { id: targetId, type } = fromGlobalId(args.profileId);
    if (type !== 'Profile') {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    let target: Profile | null;
    try {
      target = await profileLoader.load(targetId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!target) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }

    const { profileId } = auth;
    try {
      if (args.follow) {
        await follows(profileId, targetId);
      } else {
        await unfollows(profileId, targetId);
      }
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return { profile: target };
  },
});

export default toggleFollowingMutation;
