import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { ProfileTable, db } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const acceptInvitationMutation: MutationResolvers['acceptInvitation'] = async (
  _,
  { profileId: gqlProfileId },
  { loaders },
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = await loaders.Profile.load(profileId);

  if (!profile) {
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
