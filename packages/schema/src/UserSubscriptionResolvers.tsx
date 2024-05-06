import { getTotalMultiUser } from '@azzapp/data';
import type { UserSubscriptionResolvers } from './__generated__/types';

export const UserSubscription: UserSubscriptionResolvers = {
  availableSeats: async (userSubscription, _args, { auth }) => {
    if (!auth.userId || auth.userId !== userSubscription.userId) {
      return 0;
    }
    if (userSubscription.userId !== auth.userId) {
      return 0;
    }
    const totalUsed = await getTotalMultiUser(auth.userId);
    return userSubscription.totalSeats - totalUsed;
  },
  subscriptionPlan: async (userSubscription, _args) => {
    switch (userSubscription.subscriptionPlan) {
      case 'web.lifetime':
        return 'LIFETIME';
      case 'web.monthly':
        return 'MONTHLY';
      case 'web.yearly':
        return 'YEARLY';
      default:
        return null;
    }
  },
};
