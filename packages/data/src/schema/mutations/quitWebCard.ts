import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isOwner } from '@azzapp/shared/profileHelpers';
import { ProfileTable, db } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const quitWebCard: MutationResolvers['quitWebCard'] = async (
  _,
  { input: { profileId: gqlProfileId } },
  { auth, loaders },
) => {
  const { userId } = auth;
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = await loaders.Profile.load(profileId);

  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (profile.userId !== userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (isOwner(profile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await db.delete(ProfileTable).where(eq(ProfileTable.id, profileId));

  return {
    profileId: gqlProfileId,
  };
};

export default quitWebCard;
