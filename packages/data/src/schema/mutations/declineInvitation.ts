import { eq } from 'drizzle-orm';
import { fromGlobalId } from 'graphql-relay';
import { ProfileTable, db } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const declineInvitationMutation: MutationResolvers['declineInvitation'] =
  async (_, { profileId: gqlProfileId }) => {
    const profileId = fromGlobalId(gqlProfileId).id;

    await db.delete(ProfileTable).where(eq(ProfileTable.id, profileId));

    return { profileId };
  };

export default declineInvitationMutation;
