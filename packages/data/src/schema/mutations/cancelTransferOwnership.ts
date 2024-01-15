import { and, eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isOwner } from '@azzapp/shared/profileHelpers';
import { ProfileTable, db } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const cancelTransferOwnership: MutationResolvers['cancelTransferOwnership'] =
  async (_, { input }, { auth, loaders }) => {
    const { profileId } = auth;

    const { id: targetProfileId, type } = fromGlobalId(input.profileId);

    if (type !== 'Profile') {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!profileId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const profile = await loaders.Profile.load(profileId);

    if (!profile) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    if (!isOwner(profile.profileRole)) {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }

    const [targetProfile] = await db
      .select()
      .from(ProfileTable)
      .where(
        and(
          eq(ProfileTable.webCardId, profile.webCardId),
          eq(ProfileTable.id, targetProfileId),
        ),
      );

    if (!targetProfile || !targetProfile.promotedAsOwner) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    await db
      .update(ProfileTable)
      .set({ promotedAsOwner: false })
      .where(eq(ProfileTable.id, targetProfileId));

    return {
      profile: {
        ...targetProfile,
        promotedAsOwner: false,
      },
    };
  };

export default cancelTransferOwnership;
