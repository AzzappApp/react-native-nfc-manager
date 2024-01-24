import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isOwner } from '@azzapp/shared/profileHelpers';
import {
  ProfileTable,
  db,
  getUserProfileWithWebCardId,
  getWebCardPendingOwnerProfile,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const cancelTransferOwnership: MutationResolvers['cancelTransferOwnership'] =
  async (_, { input: { webCardId: gqlWebCardId } }, { auth }) => {
    const { userId } = auth;
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const profile =
      userId && (await getUserProfileWithWebCardId(userId, webCardId));

    if (!profile || !isOwner(profile.profileRole)) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const [targetProfile] = await getWebCardPendingOwnerProfile(webCardId);

    await db
      .update(ProfileTable)
      .set({ promotedAsOwner: false })
      .where(eq(ProfileTable.id, targetProfile.id));

    return {
      profile: {
        ...targetProfile,
        promotedAsOwner: false,
      },
    };
  };

export default cancelTransferOwnership;
