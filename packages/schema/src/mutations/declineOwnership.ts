import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { ProfileTable, db } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#/__generated__/types';

const declineOwnershipMutation: MutationResolvers['declineOwnership'] = async (
  _,
  { profileId: gqlProfileId },
  { loaders },
) => {
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
