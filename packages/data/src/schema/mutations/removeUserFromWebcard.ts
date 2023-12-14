import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin, isOwner } from '@azzapp/shared/profileHelpers';
import { ProfileTable, db } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const removeUserFromWebcardMutation: MutationResolvers['removeUserFromWebcard'] =
  async (_, { input }, { auth, loaders }) => {
    if (!auth.profileId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const currentProfile = await loaders.Profile.load(auth.profileId);

    if (!currentProfile || !isAdmin(currentProfile?.profileRole)) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const { id: targetProfileId, type } = fromGlobalId(input.profileId);

    if (type !== 'Profile') {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }
    const targetProfile = await loaders.Profile.load(targetProfileId);

    if (!targetProfile || isOwner(targetProfile.profileRole)) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    await db.delete(ProfileTable).where(eq(ProfileTable.id, targetProfile.id));

    return { profileId: currentProfile.id };
  };

export default removeUserFromWebcardMutation;
