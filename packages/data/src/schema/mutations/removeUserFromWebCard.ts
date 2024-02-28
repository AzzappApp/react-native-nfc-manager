import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isOwner } from '@azzapp/shared/profileHelpers';
import { ProfileTable, db } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const removeUserFromWebCard: MutationResolvers['removeUserFromWebCard'] =
  async (
    _,
    {
      profileId: gqlProfileId,
      input: { removeProfileId: gqlRemovedProfileId },
    },
    { loaders },
  ) => {
    const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');

    const profile = await loaders.Profile.load(profileId);

    const removeProfileId = fromGlobalIdWithType(
      gqlRemovedProfileId,
      'Profile',
    );
    const targetProfile = await loaders.Profile.load(removeProfileId);

    if (
      !targetProfile ||
      isOwner(targetProfile.profileRole) ||
      profile?.webCardId !== targetProfile.webCardId
    ) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    await db.delete(ProfileTable).where(eq(ProfileTable.id, targetProfile.id));

    return { profileId };
  };

export default removeUserFromWebCard;
