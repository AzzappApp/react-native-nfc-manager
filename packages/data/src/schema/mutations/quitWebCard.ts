import { eq } from 'drizzle-orm';
import { ProfileTable, db } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#schema/__generated__/types';

const quitWebCard: MutationResolvers['quitWebCard'] = async (
  _,
  { profileId: gqlProfileId },
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');

  await db.delete(ProfileTable).where(eq(ProfileTable.id, profileId));

  return {
    profileId: gqlProfileId,
  };
};

export default quitWebCard;
