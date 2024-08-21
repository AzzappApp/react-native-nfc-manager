import { GraphQLError } from 'graphql';
import {
  getProfilesByIds,
  getProfilesByWebCard,
  removeProfiles,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { updateMonthlySubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const removeUsersFromWebCard: MutationResolvers['removeUsersFromWebCard'] =
  async (
    _,
    {
      webCardId: gqlWebCardId,
      removedProfileIds: gqlRemovedProfileIds,
      allProfiles,
    },
    { auth },
  ) => {
    const { userId } = auth;
    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    if (!gqlRemovedProfileIds?.length && !allProfiles) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    const profileToRemoveIds = allProfiles
      ? null
      : gqlRemovedProfileIds?.map(id => fromGlobalIdWithType(id, 'Profile'));

    await transaction(async () => {
      const profilesToDelete = (
        allProfiles
          ? await getProfilesByWebCard(webCardId)
          : await getProfilesByIds(profileToRemoveIds ?? [])
      )
        .filter(profile => !!profile)
        .filter(
          profile =>
            profile.profileRole !== 'owner' && profile.userId !== userId,
        );

      await removeProfiles(profilesToDelete.map(profile => profile.id));
      await updateMonthlySubscription(userId, webCardId);
    });

    return allProfiles
      ? []
      : (await getProfilesByIds(profileToRemoveIds ?? []))
          .filter(profile => !!profile)
          .map(profile => profile.id);
  };

export default removeUsersFromWebCard;
