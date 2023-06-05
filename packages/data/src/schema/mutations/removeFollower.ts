import { fromGlobalId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { unfollows } from '#domains';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const removeFollowerMutation: MutationResolvers['removeFollower'] = async (
  _,
  { input },
  { auth, profileLoader },
) => {
  if (auth.isAnonymous) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const profileId = getProfileId(auth);
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(input.profileId);
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

  return { removedFollowerId: input.profileId };
};

export default removeFollowerMutation;
