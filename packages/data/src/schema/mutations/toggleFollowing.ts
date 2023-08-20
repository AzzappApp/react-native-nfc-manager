import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { follows, unfollows } from '#domains';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const toggleFollowing: MutationResolvers['toggleFollowing'] = async (
  _,
  { input },
  { auth, profileLoader },
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(input.profileId);
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

  try {
    if (input.follow) {
      await follows(profileId, targetId);
    } else {
      await unfollows(profileId, targetId);
    }
  } catch (e) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { profile: target };
};

export default toggleFollowing;
