import * as Sentry from '@sentry/nextjs';
import { getProfilesWhereUserBIsOwner } from '@azzapp/data';
import { getPaymentRequest } from '@azzapp/payment';
import { getSessionInfos } from '#GraphQLContext';
import { paymentMeanLoader } from '#loaders';
import { idResolver } from '#helpers/relayIdHelpers';
import { calculateAvailableSeats } from '#helpers/subscriptionHelpers';
import type { UserSubscriptionResolvers } from '#/__generated__/types';

export const UserSubscription: UserSubscriptionResolvers = {
  id: idResolver('UserSubscription'),
  availableSeats: async userSubscription => {
    const { userId } = getSessionInfos();

    if (userId !== userSubscription.userId) {
      const existingProfiles = userId
        ? await getProfilesWhereUserBIsOwner(userId, userSubscription.userId)
        : [];
      if (existingProfiles.length === 0) {
        return 0;
      }
    }

    return calculateAvailableSeats(userSubscription);
  },
  subscriptionPlan: async (userSubscription, _args) => {
    if (userSubscription.subscriptionId.includes('year')) {
      return 'yearly';
    }

    if (userSubscription.subscriptionId.includes('month')) {
      return 'monthly';
    }

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
  paymentMean: async userSubscription => {
    return userSubscription.paymentMeanId &&
      getSessionInfos().userId === userSubscription.userId
      ? paymentMeanLoader.load(userSubscription.paymentMeanId)
      : null;
  },
  paymentRedirectUrl: async (userSubscription, _) => {
    if (
      userSubscription.status === 'waiting_payment' &&
      userSubscription.paymentMeanId &&
      getSessionInfos().userId === userSubscription.userId
    ) {
      try {
        const result = await getPaymentRequest(userSubscription.paymentMeanId);
        return result.clientRedirectUrl ?? null;
      } catch (err) {
        Sentry.captureException(err);
      }
    }
    return null;
  },
};
