import { GraphQLError } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import {
  deleteUnusedAccounts,
  getProfilesByIds,
  getProfilesByWebCard,
  getWebCardsOwnerUsers,
  removeProfiles,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
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
    context,
  ) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    if (!gqlRemovedProfileIds?.length && !allProfiles) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const [owner] = await getWebCardsOwnerUsers([webCardId]);
    await checkWebCardProfileAdminRight(webCardId);

    const profileToRemoveIds = allProfiles
      ? null
      : gqlRemovedProfileIds?.map(id => fromGlobalIdWithType(id, 'Profile'));

    const profilesToDelete = (
      allProfiles
        ? await getProfilesByWebCard(webCardId)
        : await getProfilesByIds(profileToRemoveIds ?? [])
    )
      .filter(profile => !!profile)
      .filter(
        profile =>
          profile.profileRole !== 'owner' && profile.userId !== user.id,
      );

    await transaction(async () => {
      await deleteUnusedAccounts(profilesToDelete.map(profile => profile.id));
      await removeProfiles(
        profilesToDelete.map(profile => profile.id),
        user.id,
      );
      if (owner) {
        await updateMonthlySubscription(owner.id, context.apiEndpoint);
      }
    });

    return allProfiles
      ? []
      : profilesToDelete.map(profile => toGlobalId('Profile', profile.id));
  };

export default removeUsersFromWebCard;
