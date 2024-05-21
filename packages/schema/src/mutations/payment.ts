import { GraphQLError } from 'graphql';
import {
  createPaymentRequest,
  createSubscriptionRequest,
  createNewPaymentMean,
  estimate,
  generateInvoice,
  upgradePlan,
  endSubscription as endExistingSubscription,
  updateSubscriptionForWebCard,
} from '@azzapp/payment';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

export const estimateSubscriptionCost: MutationResolvers['estimateSubscriptionCost'] =
  async (_, { totalSeats, plan, countryCode, vatNumber }) => {
    const cost = await estimate(
      totalSeats,
      plan,
      countryCode ?? undefined,
      vatNumber ?? undefined,
    );

    return cost;
  };

export const createPaymentIntent: MutationResolvers['createPaymentIntent'] =
  async (_, { intent, webCardId }, { auth }) => {
    if (!auth.userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    try {
      const result = await createPaymentRequest({
        ...intent,
        webCardId: fromGlobalIdWithType(webCardId, 'WebCard'),
        userId: auth.userId,
      });

      if (!result?.clientRedirectUrl) {
        throw new GraphQLError(ERRORS.PAYMENT_ERROR);
      }
      return result;
    } catch (error) {
      throw new GraphQLError(ERRORS.PAYMENT_ERROR);
    }
  };

export const createSubscriptionFromPaymentMean: MutationResolvers['createSubscriptionFromPaymentMean'] =
  async (_, { intent, webCardId, paymentMeanId }, { auth }) => {
    if (!auth.userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const result = await createSubscriptionRequest({
      ...intent,
      webCardId: fromGlobalIdWithType(webCardId, 'WebCard'),
      paymentMeanId: fromGlobalIdWithType(paymentMeanId, 'PaymentMean'),
      userId: auth.userId,
    });

    return result;
  };

export const createPaymentMean: MutationResolvers['createPaymentMean'] = async (
  _,
  { webCardId, locale, redirectUrl, customer },
  { auth },
) => {
  if (!auth.userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const result = await createNewPaymentMean({
    customer,
    userId: auth.userId,
    webCardId: fromGlobalIdWithType(webCardId, 'WebCard'),
    locale,
    redirectUrl,
  });

  if (!result) {
    throw new GraphQLError(ERRORS.PAYMENT_ERROR);
  }

  return result;
};

export const generatePaymentInvoice: MutationResolvers['generatePaymentInvoice'] =
  async (_, { webCardId, paymentId }, { auth }) => {
    if (!auth.userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const result = await generateInvoice(
      fromGlobalIdWithType(webCardId, 'WebCard'),
      fromGlobalIdWithType(paymentId, 'Payment'),
    );

    if (!result) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return result;
  };

export const updateSubscription: MutationResolvers['updateSubscription'] =
  async (
    _,
    {
      webCardId: gqlWebCardId,
      paymentMeanId: gqlPaymentMeanId,
      subscriptionId: gqlSubscriptionId,
      totalSeats,
    },
    { auth },
  ) => {
    if (!auth.userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const subscriptionId = fromGlobalIdWithType(
      gqlSubscriptionId,
      'UserSubscription',
    );

    return updateSubscriptionForWebCard({
      subscriptionId,
      webCardId,
      totalSeats,
      paymentMeanId: gqlPaymentMeanId
        ? fromGlobalIdWithType(gqlPaymentMeanId, 'PaymentMean')
        : null,
    });
  };

export const upgradeSubscriptionPlan: MutationResolvers['upgradeSubscriptionPlan'] =
  async (
    _,
    { webCardId: gqlWebCardId, subscriptionId: gqlSubscriptionId },
    { auth },
  ) => {
    if (!auth.userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const subscriptionId = fromGlobalIdWithType(
      gqlSubscriptionId,
      'UserSubscription',
    );

    return upgradePlan(auth.userId, webCardId, subscriptionId);
  };

export const endSubscription: MutationResolvers['endSubscription'] = async (
  _,
  { webCardId: gqlWebCardId, subscriptionId: gqlSubscriptionId },
  { auth },
) => {
  if (!auth.userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const subscriptionId = fromGlobalIdWithType(
    gqlSubscriptionId,
    'UserSubscription',
  );

  const subscription = await endExistingSubscription(
    auth.userId,
    webCardId,
    subscriptionId,
  );

  if (!subscription) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return subscription;
};
