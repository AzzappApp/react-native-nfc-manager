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
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(removedFollowerId);
  const profile = await loaders.Profile.load(targetId);
  if (type !== 'Profile' || !profile) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  if (!profile.cardIsPrivate) {
    throw new Error(ERRORS.FORBIDDEN);
  }

  try {
    await unfollows(targetId, profileId);
  } catch (e) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { removedFollowerId };
};

export default removeFollowerMutation;
