import { eq, sql } from 'drizzle-orm';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db, follows, unfollows } from '#domains';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const toggleFollowing: MutationResolvers['toggleFollowing'] = async (
  _,
  { input },
  { auth, loaders },
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
    target = await loaders.Profile.load(targetId);
  } catch (e) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!target) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  const { follow } = input;
  try {
    db.transaction(async trx => {
      await Promise.all([
        trx
          .update(ProfileTable)
          .set({
            nbFollowers: sql`nbFollowers ${follow ? '+' : '-'} 1`,
          })
          .where(eq(ProfileTable.id, targetId)),
        trx
          .update(ProfileTable)
          .set({
            nbFollowings: sql`nbFollowings ${follow ? '+' : '-'} 1`,
          })
          .where(eq(ProfileTable.id, profileId)),

        input ? follows(profileId, targetId) : unfollows(profileId, targetId),
      ]);
    });
  } catch (e) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { profile: target };
};

export default toggleFollowing;
