import { GraphQLError } from 'graphql';
import {
  db,
  getActiveUserSubscriptionForWebCard,
  getCardModules,
  getTotalMultiUser,
  getWebCardProfilesCount,
  type UserSubscription,
  type WebCard,
  type CardModuleTemplate,
} from '@azzapp/data';
import { updateExistingSubscription } from '@azzapp/payment';
import ERRORS from '@azzapp/shared/errors';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import type { GraphQLContext } from '#GraphQLContext';
import type { DbTransaction } from '@azzapp/data/db';

export const calculateAvailableSeats = async (
  userSubscription: UserSubscription,
) => {
  let totalUsed = 0;
  if (userSubscription.webCardId) {
    totalUsed = await getWebCardProfilesCount(userSubscription.webCardId);
  } else {
    totalUsed = await getTotalMultiUser(userSubscription.userId);
  }
  return userSubscription.totalSeats + userSubscription.freeSeats - totalUsed;
};

export const checkSubscription = async (
  userId: string,
  webCardId: string,
  addedSeats: number,
) => {
  const userSubscription = await getActiveUserSubscriptionForWebCard(
    userId,
    webCardId,
  );

  const lifetime = userSubscription.find(
    subscription => subscription.subscriptionPlan === 'web.lifetime',
  );

  const monthly = userSubscription.find(
    subscription => subscription.subscriptionPlan === 'web.monthly',
  );

  const yearly = userSubscription.find(
    subscription => subscription.subscriptionPlan === 'web.yearly',
  );

  const store = userSubscription.find(
    subscription => subscription.issuer !== 'web',
  );
  if (lifetime) {
    return true;
  }

  if (monthly && monthly.status === 'active') {
    await updateExistingSubscription({
      userSubscription: monthly,
      totalSeats: monthly.totalSeats + addedSeats,
    });
    return true;
  }

  if (yearly) {
    return (await calculateAvailableSeats(yearly)) >= addedSeats;
  } else if (store) {
    return (await calculateAvailableSeats(store)) >= addedSeats;
  }

  return false;
};

export const updateMonthlySubscription = async (
  userId: string,
  webCardId: string,
  trx: DbTransaction = db,
) => {
  const subs = await getActiveUserSubscriptionForWebCard(
    userId,
    webCardId,
    trx,
  );

  const monthly = subs.find(
    subscription => subscription.subscriptionPlan === 'web.monthly',
  );

  if (monthly) {
    const seats = await getWebCardProfilesCount(webCardId, trx);

    await updateExistingSubscription(
      {
        userSubscription: monthly,
        totalSeats: seats,
      },
      trx,
    );
  }
};

export const checkWebCardHasSubscription = async (
  {
    webCard,
    appliedModules,
  }: {
    webCard: WebCard;
    appliedModules?: CardModuleTemplate[];
  },
  loaders: GraphQLContext['loaders'],
) => {
  const modules = appliedModules ?? (await getCardModules(webCard.id));

  const owner = await loaders.webCardOwners.load(webCard.id);

  if (
    webCardRequiresSubscription(modules, webCard.webCardKind) &&
    webCard.cardIsPublished
  ) {
    const subscription = owner
      ? await loaders.activeSubscriptionsLoader.load(owner.id)
      : [];
    if (subscription.length === 0) {
      throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
    }
  }
};
