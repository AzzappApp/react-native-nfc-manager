import { and, eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isOwner } from '@azzapp/shared/profileHelpers';
import { ProfileTable, db } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const cancelTransferOwnership: MutationResolvers['cancelTransferOwnership'] =
  async (_, { input }, { auth, loaders }) => {
    const profileId = fromGlobalIdWithType(input.profileId, 'Profile');
    const webCardId = fromGlobalIdWithType(input.webCardId, 'WebCard');

    const profile = await loaders.Profile.load(profileId);
    if (profile?.userId !== auth.userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    if (!profile) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!isOwner(profile.profileRole)) {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }

    const [targetProfile] = await db
      .select()
      .from(ProfileTable)
      .where(and(eq(ProfileTable.webCardId, webCardId)));

    if (!targetProfile || !targetProfile.promotedAsOwner) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    await db
      .update(ProfileTable)
      .set({ promotedAsOwner: false })
      .where(eq(ProfileTable.id, targetProfile.id));

    return {
      profile: {
        ...targetProfile,
        promotedAsOwner: false,
      },
    };
  };

export default cancelTransferOwnership;
