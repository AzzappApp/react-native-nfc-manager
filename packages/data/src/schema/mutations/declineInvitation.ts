import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

// TODO I DON'T understand  why profileId is not a globalId here
const declineInvitationMutation: MutationResolvers['declineInvitation'] =
  async (_, { input: { profileId } }, { auth, loaders }) => {
    const { userId } = auth;

    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const profile = await loaders.Profile.load(profileId);

    if (!profile || profile.userId !== userId) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    await db.delete(ProfileTable).where(eq(ProfileTable.id, profileId));

    return { profileId };
  };

export default declineInvitationMutation;
