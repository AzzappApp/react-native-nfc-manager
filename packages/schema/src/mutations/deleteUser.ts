import { GraphQLError } from 'graphql';
import {
  getUserById,
  getUserProfilesWithWebCard,
  markUserAsDeleted,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#__generated__/types';

const deleteUser: MutationResolvers['deleteUser'] = async (
  _,
  _args,
  { auth, cardUsernamesToRevalidate, loaders },
) => {
  if (!auth.userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const userId = auth.userId;
  if (
    (await loaders.activeSubscriptionsLoader.load(userId)).filter(
      sub => sub.subscriptionPlan !== 'web.lifetime',
    ).length > 0
  ) {
    throw new GraphQLError(ERRORS.SUBSCRIPTION_IS_ACTIVE);
  }

  try {
    await markUserAsDeleted(userId, userId);
    const userProfiles = await getUserProfilesWithWebCard(userId);
    userProfiles.forEach(({ profile, webCard }) => {
      if (profile.profileRole === 'owner') {
        cardUsernamesToRevalidate.add(webCard.userName);
      }
    });
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
