import { GraphQLError } from 'graphql';
import {
  getActiveUserSubscriptions,
  getTotalMultiUser,
  type UserSubscription,
} from '@azzapp/data';
import { updateExistingSubscription } from '@azzapp/payment';
import ERRORS from '@azzapp/shared/errors';

export const calculateAvailableSeats = async (
  userSubscription: UserSubscription,
) => {
  const totalUsed = await getTotalMultiUser(userSubscription.userId);
  return userSubscription.totalSeats + userSubscription.freeSeats - totalUsed;
};

const checkSubscription = async (userId: string, params: FeatureParams) => {
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

  if (monthly) {
    const availableSeats = await calculateAvailableSeats(monthly);

    if (monthly.status === 'active') {
      if (
        params.action === 'UPDATE_MULTI_USER' ||
        (params.action === 'UPDATE_WEBCARD_PUBLICATION' &&
          params.webCardIsMultiUser)
      ) {
        await updateExistingSubscription({
          userSubscription: monthly,
          totalSeats:
            monthly.totalSeats +
            ((params.alreadyAdded ? 0 : params.addedSeats) - availableSeats),
        });
      }
      return {
        hasActiveSubscription: true,
        hasEnoughSeats: true,
      };
    } else {
      return {
        hasActiveSubscription: true,
        hasEnoughSeats:
          params.action === 'UPDATE_MULTI_USER' ||
          (params.action === 'UPDATE_WEBCARD_PUBLICATION' &&
            params.webCardIsMultiUser)
            ? availableSeats >= (params.alreadyAdded ? 0 : params.addedSeats)
            : true,
      };
    }
  }

  if (yearly) {
    return {
      hasActiveSubscription: true,
      hasEnoughSeats:
        params.action === 'UPDATE_MULTI_USER' ||
        (params.action === 'UPDATE_WEBCARD_PUBLICATION' &&
          params.webCardIsMultiUser)
          ? (await calculateAvailableSeats(yearly)) >=
            (params.alreadyAdded ? 0 : params.addedSeats)
          : true,
    };
  } else if (store) {
    return {
      hasActiveSubscription: true,
      hasEnoughSeats:
        params.action === 'UPDATE_MULTI_USER' ||
        (params.action === 'UPDATE_WEBCARD_PUBLICATION' &&
          params.webCardIsMultiUser)
          ? (await calculateAvailableSeats(store)) >=
            (params.alreadyAdded ? 0 : params.addedSeats)
          : true,
    };
  }

  return result;
};

type FeatureParams =
  | {
      action: 'UPDATE_MULTI_USER';
      addedSeats: number;
      alreadyAdded?: boolean;
      webCardIsPublished: boolean;
    }
  | {
      action: 'UPDATE_WEBCARD_KIND';
      webCardKind: string;
      webCardIsPublished: boolean;
    }
  | {
      action: 'UPDATE_WEBCARD_PUBLICATION';
      alreadyPublished: number;
      webCardKind: string;
      addedSeats: number;
      alreadyAdded?: boolean;
      webCardIsMultiUser: true;
      webCardIsPublished: boolean;
    }
  | {
      action: 'UPDATE_WEBCARD_PUBLICATION';
      alreadyPublished: number;
      webCardKind: string;
      webCardIsMultiUser: false;
      webCardIsPublished: boolean;
    };

export const validateCurrentSubscription = async (
  userId: string,
  params: FeatureParams,
) => {
  if (!params.webCardIsPublished) {
    return;
  }

  if (
    params.action === 'UPDATE_WEBCARD_KIND' &&
    params.webCardKind !== 'business'
  ) {
    return;
  }

  if (
    params.action === 'UPDATE_WEBCARD_PUBLICATION' &&
    params.webCardKind !== 'business' &&
    params.alreadyPublished < 2 &&
    !params.webCardIsMultiUser
  ) {
    return;
  }

  const { hasActiveSubscription, hasEnoughSeats } = await checkSubscription(
    userId,
    params,
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

  if (monthly && monthly.status === 'active') {
    const seats = Math.max(await getTotalMultiUser(userId), 1);

    await updateExistingSubscription({
      userSubscription: monthly,
      totalSeats: seats,
    });
  }
};
