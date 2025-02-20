import { GraphQLError } from 'graphql';
import {
  getUserById,
  getUserProfilesWithWebCard,
  getWebCardsOwnerUsers,
  markUserAsDeleted,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { activeSubscriptionsForUserLoader } from '#loaders';
import { updateMonthlySubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';

const deleteUser: MutationResolvers['deleteUser'] = async () => {
  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  if (
    (await activeSubscriptionsForUserLoader.load(userId)).filter(
      sub => sub.subscriptionPlan !== 'web.lifetime',
    ).length > 0
  ) {
    throw new GraphQLError(ERRORS.SUBSCRIPTION_IS_ACTIVE);
  }

  try {
    await markUserAsDeleted(userId, userId);
    const userProfiles = await getUserProfilesWithWebCard(userId);
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

  const user = await getUserById(userId);

  if (!user) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  return user;
};

export default deleteUser;
