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
  updateCustomer,
} from '@azzapp/payment';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import {
  hasWebCardOwnerProfile,
  hasWebCardProfileAdminRight,
} from '#helpers/permissionsHelpers';
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
  async (_, { intent, webCardId: gqlWebCardId }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    if (!(await hasWebCardOwnerProfile(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    const { userId } = getSessionInfos();
    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    try {
      const result = await createPaymentRequest({
        ...intent,
        webCardId,
        userId,
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
  async (_, { intent, webCardId: gqlWebCardId, paymentMeanId }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    if (!(await hasWebCardOwnerProfile(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const { userId } = getSessionInfos();
    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const result = await createSubscriptionRequest({
      ...intent,
      webCardId,
      paymentMeanId: fromGlobalIdWithType(paymentMeanId, 'PaymentMean'),
      userId,
    });

    return result;
  };

export const createPaymentMean: MutationResolvers['createPaymentMean'] = async (
  _,
  {
    webCardId: gqlWebCardId,
    locale,
    redirectUrlSuccess,
    redirectUrlCancel,
    customer,
  },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  if (!(await hasWebCardOwnerProfile(webCardId))) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const result = await createNewPaymentMean({
    customer,
    userId,
    webCardId,
    locale,
    redirectUrlSuccess,
    redirectUrlCancel,
  });

  if (!result) {
    throw new GraphQLError(ERRORS.PAYMENT_ERROR);
  }

  return result;
};

export const generatePaymentInvoice: MutationResolvers['generatePaymentInvoice'] =
  async (_, { webCardId: gqlWebCardId, paymentId }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    if (!(await hasWebCardOwnerProfile(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const { userId } = getSessionInfos();
    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const result = await generateInvoice(
      webCardId,
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
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const subscriptionId = fromGlobalIdWithType(
      gqlSubscriptionId,
      'UserSubscription',
    );

    if (!(await hasWebCardOwnerProfile(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    const { userId } = getSessionInfos();
    if (!userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

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
  async (_, { webCardId: gqlWebCardId, subscriptionId: gqlSubscriptionId }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const subscriptionId = fromGlobalIdWithType(
      gqlSubscriptionId,
      'UserSubscription',
    );

    if (!(await hasWebCardOwnerProfile(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    return upgradePlan(webCardId, subscriptionId);
  };

export const endSubscription: MutationResolvers['endSubscription'] = async (
  _,
  { webCardId: gqlWebCardId, subscriptionId: gqlSubscriptionId },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const subscriptionId = fromGlobalIdWithType(
    gqlSubscriptionId,
    'UserSubscription',
  );
  if (!(await hasWebCardOwnerProfile(webCardId))) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const subscription = await endExistingSubscription(webCardId, subscriptionId);

  if (!subscription) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return subscription;
};

export const updateSubscriptionCustomer: MutationResolvers['updateSubscriptionCustomer'] =
  async (
    _,
    { webCardId: gqlWebCardId, subscriptionId: gqlSubscriptionId, customer },
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const subscriptionId = fromGlobalIdWithType(
      gqlSubscriptionId,
      'UserSubscription',
    );

    if (!(await hasWebCardProfileAdminRight(webCardId))) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    return updateCustomer(webCardId, subscriptionId, customer);
  };
