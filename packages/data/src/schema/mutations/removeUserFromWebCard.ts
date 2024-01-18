import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin, isOwner } from '@azzapp/shared/profileHelpers';
import { ProfileTable, db } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const removeUserFromWebCard: MutationResolvers['removeUserFromWebCard'] =
  async (
    _,
    {
      input: { profileId: gqlProfileId, removeProfileId: gqlRemovedProfileId },
    },
    { auth, loaders },
  ) => {
    const { userId } = auth;
    const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');

    const profile = profileId && (await loaders.Profile.load(profileId));

    if (!profile || !isAdmin(profile.profileRole)) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    if (profile.userId !== userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const currentProfile = profileId && (await loaders.Profile.load(profileId));

    if (!currentProfile || !isAdmin(currentProfile.profileRole)) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const removeProfileId = fromGlobalIdWithType(
      gqlRemovedProfileId,
      'Profile',
    );
    const targetProfile = await loaders.Profile.load(removeProfileId);

    if (!targetProfile || isOwner(targetProfile.profileRole)) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    await db.delete(ProfileTable).where(eq(ProfileTable.id, targetProfile.id));

    return { profileId };
  };

export default removeUserFromWebCard;
