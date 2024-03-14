import { and, eq, inArray, ne } from 'drizzle-orm';
import { toGlobalId } from 'graphql-relay';
import { ProfileTable, db } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const removeUsersFromWebCard: MutationResolvers['removeUsersFromWebCard'] =
  async (
    _,
    { webCardId: gqlWebCardId, removedProfileIds: gqlRemovedProfileIds },
    { loaders },
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    const removedProfileIds = gqlRemovedProfileIds.map(id =>
      fromGlobalIdWithType(id, 'Profile'),
    );

    await db
      .delete(ProfileTable)
      .where(
        and(
          inArray(ProfileTable.id, removedProfileIds),
          eq(ProfileTable.webCardId, webCardId),
          ne(ProfileTable.profileRole, 'owner'),
        ),
      );

    const notRemovedProfiles =
      await loaders.Profile.loadMany(removedProfileIds);

    const notRemovedProfilesIds = notRemovedProfiles
      .filter(profile => profile !== null && !(profile instanceof Error))
      .map(profile => (profile as Profile).id);

    return {
      profileIds: removedProfileIds
        .filter(id => !notRemovedProfilesIds.includes(id))
        .map(id => toGlobalId('Profile', id)),
    };
  };

export default removeUsersFromWebCard;
