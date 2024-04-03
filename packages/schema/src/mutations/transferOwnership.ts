import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { ProfileTable, db } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const transferOwnership: MutationResolvers['transferOwnership'] = async (
  _,
  { webCardId: gqlWebCardId, input: { profileId: gqlProfileId } },
  { loaders },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const targetProfileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const targetProfile = await loaders.Profile.load(targetProfileId);

  if (!targetProfile || targetProfile.webCardId !== webCardId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
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
