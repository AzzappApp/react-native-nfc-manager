import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const acceptInvitationMutation: MutationResolvers['acceptInvitation'] = async (
  _,
  _args,
  { auth, loaders },
) => {
  const { profileId, userId } = auth;

  if (!profileId || !userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
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
