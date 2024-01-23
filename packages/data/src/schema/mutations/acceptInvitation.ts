import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const acceptInvitationMutation: MutationResolvers['acceptInvitation'] = async (
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

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await db
    .update(ProfileTable)
    .set({ invited: false })
    .where(eq(ProfileTable.id, profileId));

  return {
    profile: {
      ...profile,
      invited: false,
    },
  };
};

export default acceptInvitationMutation;
