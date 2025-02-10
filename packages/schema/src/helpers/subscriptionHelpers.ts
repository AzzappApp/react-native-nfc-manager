import { GraphQLError } from 'graphql';
import {
  getActiveUserSubscriptions,
  getTotalMultiUser,
  type UserSubscription,
  type WebCard,
  type CardModuleTemplate,
  getCardModulesByWebCard,
} from '@azzapp/data';
import { updateExistingSubscription } from '@azzapp/payment';
import ERRORS from '@azzapp/shared/errors';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import { activeSubscriptionsForUserLoader, webCardOwnerLoader } from '#loaders';

export const calculateAvailableSeats = async (
  userSubscription: UserSubscription,
) => {
  const totalUsed = await getTotalMultiUser(userSubscription.userId);
  return userSubscription.totalSeats + userSubscription.freeSeats - totalUsed;
};

const checkSubscription = async (
  userId: string,
  addedSeats: number,
  alreadyAdded?: boolean,
) => {
  const result = { hasActiveSubscription: false, hasEnoughSeats: false };
  const userSubscription = await getActiveUserSubscriptions([userId]);

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
    return {
      hasActiveSubscription: true,
      hasEnoughSeats: true,
    };
  }

  if (monthly && monthly.status === 'active') {
    const availableSeats = await calculateAvailableSeats(monthly);

    await updateExistingSubscription({
      userSubscription: monthly,
      totalSeats:
        monthly.totalSeats + ((alreadyAdded ? 0 : addedSeats) - availableSeats),
    });
    return {
      hasActiveSubscription: true,
      hasEnoughSeats: true,
    };
  }

  if (yearly) {
    return {
      hasActiveSubscription: true,
      hasEnoughSeats:
        (await calculateAvailableSeats(yearly)) >=
        (alreadyAdded ? 0 : addedSeats),
    };
  } else if (store) {
    return {
      hasActiveSubscription: true,
      hasEnoughSeats:
        (await calculateAvailableSeats(store)) >=
        (alreadyAdded ? 0 : addedSeats),
    };
  }

  return result;
};

export const validateCurrentSubscription = async (
  userId: string,
  addedSeats: number,
  alreadyAdded?: boolean,
) => {
  const { hasActiveSubscription, hasEnoughSeats } = await checkSubscription(
    userId,
    addedSeats,
    alreadyAdded,
  );

  if (!hasActiveSubscription) {
    throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
  }

  if (!hasEnoughSeats) {
    throw new GraphQLError(ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS);
  }
};

export const updateMonthlySubscription = async (userId: string) => {
  const subs = await getActiveUserSubscriptions([userId]);

  const monthly = subs.find(
    subscription => subscription.subscriptionPlan === 'web.monthly',
  );

  if (monthly) {
    const seats = await getTotalMultiUser(userId);

    await updateExistingSubscription({
      userSubscription: monthly,
      totalSeats: seats,
    });
  }
};

export const checkWebCardHasSubscription = async ({
  webCard,
  appliedModules,
}: {
  webCard: WebCard;
  appliedModules?: CardModuleTemplate[];
}) => {
  const modules = appliedModules ?? (await getCardModulesByWebCard(webCard.id));

  const owner = await webCardOwnerLoader.load(webCard.id);

  if (
    webCardRequiresSubscription(modules, webCard) &&
    webCard.cardIsPublished
  ) {
    const subscription = owner
      ? await activeSubscriptionsForUserLoader.load(owner.id)
      : [];
    if (!subscription) {
      throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
    }
  }
};
