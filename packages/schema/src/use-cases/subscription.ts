import {
  getActiveUserSubscriptionForWebCard,
  getTotalMultiUser,
  getWebCardProfilesCount,
  type UserSubscription,
} from '@azzapp/data';
import { updateExistingSubscription } from '@azzapp/payment';

export const calculateAvailableSeats = async (
  userSubscription: UserSubscription,
) => {
  let totalUsed = 0;
  if (userSubscription.webCardId) {
    totalUsed = await getWebCardProfilesCount(userSubscription.webCardId);
  } else {
    totalUsed = await getTotalMultiUser(userSubscription.userId);
  }
  return userSubscription.totalSeats - totalUsed;
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
