import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { unfollows } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const removeFollowerMutation: MutationResolvers['removeFollower'] = async (
  _,
  { input: { profileId: removedFollowerId } },
  { auth, loaders },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(removedFollowerId);
  const profile = await loaders.Profile.load(targetId);
  if (type !== 'Profile' || !profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!profile.cardIsPrivate) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  try {
    await unfollows(targetId, profileId);
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { removedFollowerId };
};

export default removeFollowerMutation;
