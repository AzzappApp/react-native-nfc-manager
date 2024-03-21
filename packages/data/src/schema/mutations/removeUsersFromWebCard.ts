import { and, eq, inArray, ne } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const removeUsersFromWebCard: MutationResolvers['removeUsersFromWebCard'] =
  async (
    _,
    {
      webCardId: gqlWebCardId,
      removedProfileIds: gqlRemovedProfileIds,
      allProfiles,
    },
    { loaders, auth },
  ) => {
    if (!auth.userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    if (!gqlRemovedProfileIds?.length && !allProfiles) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    const removedProfileIds = allProfiles
      ? null
      : gqlRemovedProfileIds?.map(id => fromGlobalIdWithType(id, 'Profile'));

    const profileToDelete = allProfiles
      ? await db
          .select({ id: ProfileTable.id })
          .from(ProfileTable)
          .where(
            and(
              eq(ProfileTable.webCardId, webCardId),
              ne(ProfileTable.profileRole, 'owner'),
              ne(ProfileTable.userId, auth.userId),
            ),
          )
          .then(profiles => profiles.map(profile => profile.id))
      : removedProfileIds ?? [];

    await db
      .delete(ProfileTable)
      .where(
        removedProfileIds
          ? and(
              inArray(ProfileTable.id, removedProfileIds),
              eq(ProfileTable.webCardId, webCardId),
              ne(ProfileTable.profileRole, 'owner'),
              ne(ProfileTable.userId, auth.userId),
            )
          : and(
              eq(ProfileTable.webCardId, webCardId),
              ne(ProfileTable.profileRole, 'owner'),
              ne(ProfileTable.userId, auth.userId),
            ),
      );

    const notRemovedProfiles = await loaders.Profile.loadMany(profileToDelete);

    const notRemovedProfilesIds = notRemovedProfiles
      .filter(profile => profile !== null && !(profile instanceof Error))
      .map(profile => (profile as Profile).id);

    return profileToDelete
      .filter(id => !notRemovedProfilesIds.includes(id))
      .map(id => toGlobalId('Profile', id));
  };

export default removeUsersFromWebCard;
