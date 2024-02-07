import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const declineOwnershipMutation: MutationResolvers['declineOwnership'] = async (
  _,
  { input: { profileId: gqlProfileId } },
  { auth, loaders },
) => {
  const { userId } = auth;

  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profileId = fromGlobalId(gqlProfileId).id;

  const profile = await loaders.Profile.load(profileId);

  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await db
    .update(ProfileTable)
    .set({ promotedAsOwner: false })
    .where(eq(ProfileTable.id, profileId));

  return { profile: { ...profile, promotedAsOwner: false } };
};

export default declineOwnershipMutation;
