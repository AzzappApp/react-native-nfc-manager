import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isOwner } from '@azzapp/shared/profileHelpers';
import { ProfileTable, db, getUserProfileWithWebCardId } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const transferOwnership: MutationResolvers['transferOwnership'] = async (
  _,
  { input: { profileId: gqlProfileId, webCardId: gqlWebCardId } },
  { auth, loaders },
) => {
  const { userId } = auth;
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const profile =
    userId && (await getUserProfileWithWebCardId(userId, webCardId));

  if (!profile || !isOwner(profile.profileRole)) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const targetProfileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const targetProfile = await loaders.Profile.load(targetProfileId);

  if (!targetProfile || targetProfile.webCardId !== profile.webCardId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (!isOwner(profile.profileRole)) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  await db
    .update(ProfileTable)
    .set({ promotedAsOwner: true })
    .where(eq(ProfileTable.id, targetProfileId));

  return {
    profile: {
      ...targetProfile,
      promotedAsOwner: true,
    },
  };
};

export default transferOwnership;
