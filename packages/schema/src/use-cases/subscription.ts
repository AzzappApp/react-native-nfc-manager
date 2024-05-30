import {
  db,
  getActiveUserSubscriptionForWebCard,
  getTotalMultiUser,
  getWebCardProfilesCount,
  type UserSubscription,
} from '@azzapp/data';
import { updateExistingSubscription } from '@azzapp/payment';
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

  const store = userSubscription.find(subscription => !subscription.webCardId);

  if (lifetime) {
    return true;
  }

  if (monthly) {
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
