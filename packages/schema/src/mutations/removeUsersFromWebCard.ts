import { and, eq, inArray, ne } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import { ProfileTable, db } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { updateMonthlySubscription } from '#use-cases/subscription';
import type { MutationResolvers } from '#/__generated__/types';
import type { Profile } from '@azzapp/data';

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
    const { userId } = auth;
    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    if (!gqlRemovedProfileIds?.length && !allProfiles) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    const removedProfileIds = allProfiles
      ? null
      : gqlRemovedProfileIds?.map(id => fromGlobalIdWithType(id, 'Profile'));

    const profileToDelete = await db.transaction(async trx => {
      const profileToDelete = allProfiles
        ? await trx
            .select({ id: ProfileTable.id })
            .from(ProfileTable)
            .where(
              and(
                eq(ProfileTable.webCardId, webCardId),
                ne(ProfileTable.profileRole, 'owner'),
                ne(ProfileTable.userId, userId),
              ),
            )
            .then(profiles => profiles.map(profile => profile.id))
        : removedProfileIds ?? [];

      await trx
        .delete(ProfileTable)
        .where(
          removedProfileIds
            ? and(
                inArray(ProfileTable.id, removedProfileIds),
                eq(ProfileTable.webCardId, webCardId),
                ne(ProfileTable.profileRole, 'owner'),
                ne(ProfileTable.userId, userId),
              )
            : and(
                eq(ProfileTable.webCardId, webCardId),
                ne(ProfileTable.profileRole, 'owner'),
                ne(ProfileTable.userId, userId),
              ),
        );

      await updateMonthlySubscription(userId, webCardId, trx);

      return profileToDelete;
    });

    const notRemovedProfiles = await loaders.Profile.loadMany(profileToDelete);

    const notRemovedProfilesIds = notRemovedProfiles
      .filter(profile => profile !== null && !(profile instanceof Error))
      .map(profile => (profile as Profile).id);

    return profileToDelete
      .filter(id => !notRemovedProfilesIds.includes(id))
      .map(id => toGlobalId('Profile', id));
  };

export default removeUsersFromWebCard;
