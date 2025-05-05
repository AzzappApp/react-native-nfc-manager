import { GraphQLError } from 'graphql';
import {
  getUserById,
  getUserProfilesWithWebCard,
  getWebCardsOwnerUsers,
  markUserAsDeleted,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { getSessionUser } from '#GraphQLContext';
import { subscriptionsForUserLoader } from '#loaders';
import { updateMonthlySubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';

const deleteUser: MutationResolvers['deleteUser'] = async () => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  if (
    (await subscriptionsForUserLoader.load(user.id)).filter(
      sub => sub.subscriptionPlan !== 'web.lifetime' && sub.status === 'active',
    ).length > 0
  ) {
    throw new GraphQLError(ERRORS.SUBSCRIPTION_IS_ACTIVE);
  }

  try {
    await markUserAsDeleted(user.id, user.id);
    const userProfiles = await getUserProfilesWithWebCard(user.id);
    userProfiles.forEach(({ profile, webCard }) => {
      if (profile.profileRole === 'owner' && webCard.userName) {
        invalidateWebCard(webCard.userName);
      }
    });

    const webCardIds: string[] = [];
    userProfiles.forEach(({ profile, webCard }) => {
      if (profile.profileRole !== 'owner' && webCard.id) {
        webCardIds.push(webCard.id);
      }
    });
    const owners = (await getWebCardsOwnerUsers(webCardIds)).filter(
      owner => !!owner,
    );
    if (owners.length > 0) {
      for (const owner of owners) {
        await updateMonthlySubscription(owner.id);
      }
    }
  } catch (error) {
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const newUser = await getUserById(user.id);

  if (!newUser) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  // FIXME shall delete FCM token ?
  return newUser;
};

export default deleteUser;
