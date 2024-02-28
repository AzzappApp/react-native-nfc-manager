import { eq } from 'drizzle-orm';
import { ProfileTable, db, getWebCardPendingOwnerProfile } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const cancelTransferOwnership: MutationResolvers['cancelTransferOwnership'] =
  async (_, { webCardId: gqlWebCardId }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

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
