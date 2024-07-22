import { eq, and } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { ProfileTable, db } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#/__generated__/types';

const acceptOwnership: MutationResolvers['acceptOwnership'] = async (
  _,
  { profileId: gqlProfileId },
  { auth, loaders },
) => {
  const { userId } = auth;
  const profileId = fromGlobalId(gqlProfileId).id;

  const [profile, user] = await Promise.all([
    loaders.Profile.load(profileId),
    userId && loaders.User.load(userId),
  ]);

  if (!user || !profile?.promotedAsOwner) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);
  if (!webCard) {
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
      .set({ profileRole: 'owner', promotedAsOwner: false, invited: false })
      .where(eq(ProfileTable.id, profileId));
  });

  return {
    profile: {
      ...profile,
      profileRole: 'owner',
      promotedAsOwner: false,
      invited: false,
    },
  };
};

export default acceptOwnership;
