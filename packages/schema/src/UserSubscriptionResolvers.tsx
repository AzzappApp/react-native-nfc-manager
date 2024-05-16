import { calculateAvailableSeats } from '#use-cases/subscription';
import { idResolver } from './utils';
import type { UserSubscriptionResolvers } from './__generated__/types';

export const UserSubscription: UserSubscriptionResolvers = {
  id: idResolver('UserSubscription'),
  availableSeats: async (userSubscription, _args, { auth }) => {
    if (!auth.userId || auth.userId !== userSubscription.userId) {
      return 0;
    }
    if (userSubscription.userId !== auth.userId) {
      return 0;
    }

    return calculateAvailableSeats(userSubscription);
  },
  subscriptionPlan: async (userSubscription, _args) => {
    switch (userSubscription.subscriptionPlan) {
      case 'web.lifetime':
        return 'lifetime';
      case 'web.monthly':
        return 'monthly';
      case 'web.yearly':
        return 'yearly';
      default:
        return null;
    }
  },
  paymentMean: async (userSubscription, _, { loaders }) => {
    return userSubscription.paymentMeanId
      ? loaders.PaymentMean.load(userSubscription.paymentMeanId)
      : null;
  },
};
