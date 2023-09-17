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
    await db.transaction(async trx => {
      await trx
        .update(ProfileTable)
        .set({
          nbFollowers: follow ? sql`nbFollowers + 1` : sql`nbFollowers - 1`,
        })
        .where(eq(ProfileTable.id, targetId));

      await trx
        .update(ProfileTable)
        .set({
          nbFollowings: follow ? sql`nbFollowings + 1` : sql`nbFollowings - 1`,
        })
        .where(eq(ProfileTable.id, profileId));

      if (follow) await follows(profileId, targetId, trx);
      else await unfollows(profileId, targetId, trx);
    });
  } catch (e) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { profile: target };
};

export default toggleFollowing;
