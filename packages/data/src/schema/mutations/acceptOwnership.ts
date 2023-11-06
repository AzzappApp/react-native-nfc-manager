import { eq, and } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const acceptOwnership: MutationResolvers['acceptOwnership'] = async (
  _,
  _args,
  { auth, loaders },
) => {
  const { profileId } = auth;

  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (!profile || !profile.promotedAsOwner) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await db.transaction(async trx => {
    await trx
      .update(ProfileTable)
      .set({ profileRole: 'admin' })
      .where(
        and(
          eq(ProfileTable.webCardId, profile.webCardId),
          eq(ProfileTable.profileRole, 'owner'),
        ),
      );

    await trx
      .update(ProfileTable)
      .set({ profileRole: 'owner', promotedAsOwner: false })
      .where(eq(ProfileTable.id, profileId));
  });

  return {
    profile: {
      ...profile,
      profileRole: 'owner',
      promotedAsOwner: false,
    },
  };
};

export default acceptOwnership;
